/**
 * GLPI Ticket Guided Wizard — wizard.js
 *
 * Provides a step-by-step guided tour for ticket creation in both:
 *   - Standard Interface  (front/ticket.form.php, technician view), GLPI 10 and 11
 *   - Simplified Interface (end-user / helpdesk view):
 *       GLPI 10: the ticket form (front/helpdesk.public.php?create_ticket=1)
 *       GLPI 11: the service catalog forms (/Form/Render/<id>)
 *
 * Features:
 *   - Dynamic layout (white panel, orange highlight)
 *   - Red highlight automatically triggered if highlighted field has a missing value
 *   - Closes / hides modal when dropdown lists are opened
 *   - Asynchronous fetch of admin visiblity settings (Setup > Plugins > Ticket Guided Wizard)
 *
 * Supports: EN, JA, KO, VI, PT (Brasil), IT
 */

(function () {
    'use strict';

    /* ------------------------------------------------------------------ */
    /*  TRANSLATIONS                                                        */
    /* ------------------------------------------------------------------ */
    const TRANSLATIONS = {
        en: {
            welcomeTitle: 'Need help creating a ticket?',
            welcomeDesc:  'Welcome! Let our guided wizard help you fill in the ticket form step-by-step.',
            btnStart:  'Start Guide',
            btnClose:  'Close',
            btnNext:   'Next',
            btnBack:   'Back',
            btnFinish: 'Finish',
            btnCreate: 'Create Ticket',
            warnMissing: '⚠ Please fill in all required fields (marked *) before creating the ticket.',

            stepTypeTitle:     'Ticket Type',
            stepTypeDesc:      'Choose whether this is an Incident (something is broken and needs fixing) or a Request (you need something new, like a software installation or new hardware).',
            stepCategoryTitle: 'Category',
            stepCategoryDesc:  'Select the category that best describes your issue. This routes the ticket to the right support team automatically.',
            stepUrgencyTitle:  'Urgency',
            stepUrgencyDesc:   'Set how urgently this needs to be resolved. Reserve "Very High" for critical failures that block business operations.',
            stepImpactTitle:   'Impact',
            stepImpactDesc:    'Select the scope of impact. Does this affect only you, your whole department, or the entire organisation?',
            stepPriorityTitle: 'Priority',
            stepPriorityDesc:  'Priority is usually auto-calculated from Urgency + Impact. You may override it only if you have a specific reason.',
            stepLocationTitle: 'Location',
            stepLocationDesc:  'Specify where the issue is occurring — e.g. your office branch, floor, or room number — so a technician can visit if needed.',
            stepAssetTitle:    'Associated Asset / Device',
            stepAssetDesc:     'Link the hardware or software asset affected (e.g. your laptop, desktop, or printer). This helps technicians identify the exact device.',
            stepRequesterTitle:'Requester',
            stepRequesterDesc: 'This is the person opening the ticket (usually you). Change it only if you are creating this ticket on behalf of someone else.',
            stepObserverTitle: 'Observer (Watcher)',
            stepObserverDesc:  'Add any colleagues who should receive email updates about this ticket\'s progress — they won\'t be responsible for it, just kept informed.',
            stepAssigneeTitle: 'Assigned To',
            stepAssigneeDesc:  'Optionally assign the ticket directly to a technician, a technical group, or an external supplier who will handle the resolution.',
            stepTitleTitle:    'Title',
            stepTitleDesc:     'Write a short, clear summary of the problem (e.g. "Cannot connect to office Wi-Fi on laptop"). A good title helps technicians prioritise quickly.',
            stepDescTitle:     'Description',
            stepDescDesc:      'Describe the issue in as much detail as possible: what happened, any error messages you saw, what you were doing at the time, and steps to reproduce it.',
            stepAttachTitle:   'Attachments',
            stepAttachDesc:    'Upload relevant files such as screenshots of error messages, log files, or photos of hardware damage. This can significantly speed up resolution.',
            stepSubmitTitle:   'Submit Ticket',
            stepSubmitDesc:    'Everything looks good? Click the "{button}" button to submit your ticket. The support team will be notified and will follow up with you.',
            stepContinueTitle: 'Next Page',
            stepContinueDesc:  'Done with this page? Click "{button}" to go to the next part of the form.',
            stepOtherTitle:    'Question',
            stepOtherDesc:     'Answer this question. Questions marked * are required.',
            btnAddFallback:    'Add',
            ariaGuide:         'Ticket creation guide',
            ariaCloseGuide:    'Close guide',
            ariaHelpButton:    'Start ticket creation guide',
            guideHint:         'Not sure what to fill in?',
            guideButton:       'Step-by-step guide',
            welcomeHide:       'Don\'t show this again',
        },

        ja: {
            welcomeTitle: 'チケットの作成でお困りですか？',
            welcomeDesc:  'ようこそ！ガイド付きウィザードを使って、チケットフォームをステップバイステップで入力しましょう。',
            btnStart:  'ガイドを開始',
            btnClose:  '閉じる',
            btnNext:   '次へ',
            btnBack:   '戻る',
            btnFinish: '完了',
            btnCreate: 'チケットを作成',
            warnMissing: '⚠ チケットを作成する前に、必須項目（*）をすべて入力してください。',

            stepTypeTitle:     'チケットタイプ',
            stepTypeDesc:      '「インシデント」（何かが壊れて修理が必要）か「要望」（ソフトウェアインストールや新しい機器など、新しいものが必要）を選択してください。',
            stepCategoryTitle: 'カテゴリー',
            stepCategoryDesc:  '問題に最も近いカテゴリーを選択してください。これにより、チケットが自動的に適切な技術チームに転送されます。',
            stepUrgencyTitle:  '緊急度',
            stepUrgencyDesc:   '解決の緊急性を設定してください。「非常に高い」は業務を完全に停止させる重大な障害の場合のみ選択してください。',
            stepImpactTitle:   '影響度',
            stepImpactDesc:    '影響の範囲を選択してください。あなた個人だけか、部門全体か、組織全体に影響するかを確認してください。',
            stepPriorityTitle: '優先度',
            stepPriorityDesc:  '優先度は通常、緊急度と影響度から自動計算されます。特別な理由がある場合のみ手動で変更してください。',
            stepLocationTitle: '場所',
            stepLocationDesc:  '問題が発生している場所（例：支社名、フロア、部屋番号）を指定してください。技術者が現地対応する場合に役立ちます。',
            stepAssetTitle:    '関連アセット（機器）',
            stepAssetDesc:     '問題が発生しているハードウェアまたはソフトウェア資産（ノートPC、デスクトップ、プリンターなど）を紐付けてください。技術者が対象デバイスをすぐ特定できます。',
            stepRequesterTitle:'申請者',
            stepRequesterDesc: 'チケットを申請する人（通常はあなた）です。他の人の代わりに申請する場合のみ変更してください。',
            stepObserverTitle: 'オブザーバー（監視者）',
            stepObserverDesc:  'このチケットの進捗をメールで受け取りたい同僚を追加してください。担当者ではなく、情報共有のみを目的とします。',
            stepAssigneeTitle: '担当者',
            stepAssigneeDesc:  '（任意）特定の技術者、技術グループ、または外部サプライヤーを直接指定できます。',
            stepTitleTitle:    'タイトル',
            stepTitleDesc:     '問題を短く明確に表現してください（例：「社内Wi-Fiにノートパソコンで接続できない」）。良いタイトルは迅速なトリアージに役立ちます。',
            stepDescTitle:     '説明',
            stepDescDesc:      '可能な限り詳しく説明してください。エラーメッセージ、発生時の操作内容、再現手順を記載すると解決が早まります。',
            stepAttachTitle:   '添付ファイル',
            stepAttachDesc:    'エラーのスクリーンショット、ログファイル、機器の写真など、関連ファイルをアップロードしてください。解決速度が大幅に向上します。',
            stepSubmitTitle:   'チケットの送信',
            stepSubmitDesc:    '内容が確認できたら、「{button}」ボタンをクリックして送信してください。サポートチームに通知が届き、対応が開始されます。',
            stepContinueTitle: '次のページ',
            stepContinueDesc:  'このページの入力が終わったら、「{button}」をクリックしてフォームの次の部分に進んでください。',
            stepOtherTitle:    '質問',
            stepOtherDesc:     'この質問に回答してください。* の付いた質問は必須です。',
            btnAddFallback:    '追加',
            ariaGuide:         'チケット作成ガイド',
            ariaCloseGuide:    'ガイドを閉じる',
            ariaHelpButton:    'チケット作成ガイドを開始',
            guideHint:         '何を入力すればよいか分かりませんか？',
            guideButton:       'ステップごとのガイド',
            welcomeHide:       '今後表示しない',
        },

        ko: {
            welcomeTitle: '티켓 작성에 도움이 필요하십니까?',
            welcomeDesc:  '환영합니다! 가이드 마법사를 통해 티켓 양식을 단계별로 작성해 보세요.',
            btnStart:  '가이드 시작',
            btnClose:  '닫기',
            btnNext:   '다음',
            btnBack:   '이전',
            btnFinish: '완료',
            btnCreate: '티켓 생성',
            warnMissing: '⚠ 티켓을 생성하기 전에 모든 필수 항목(*)을 입력하십시오.',

            stepTypeTitle:     '티켓 유형',
            stepTypeDesc:      '장애(무언가 고장 나서 수리 필요)인지 요청(소프트웨어 설치나 신규 하드웨어 등 새로운 것이 필요)인지 선택하십시오.',
            stepCategoryTitle: '카테고리',
            stepCategoryDesc:  '문제를 가장 잘 설명하는 카테고리를 선택하십시오. 적절한 기술 팀으로 자동 배정됩니다.',
            stepUrgencyTitle:  '긴급도',
            stepUrgencyDesc:   '해결이 얼마나 시급한지 설정하십시오. "매우 높음"은 업무 운영을 완전히 차단하는 심각한 장애에만 사용해야 합니다.',
            stepImpactTitle:   '영향도',
            stepImpactDesc:    '영향 범위를 선택하십시오. 본인만 해당되는지, 부서 전체인지, 조직 전체인지 확인하십시오.',
            stepPriorityTitle: '우선순위',
            stepPriorityDesc:  '우선순위는 일반적으로 긴급도와 영향도를 기반으로 자동 계산됩니다. 특별한 이유가 있을 때만 직접 수정하십시오.',
            stepLocationTitle: '위치',
            stepLocationDesc:  '문제가 발생한 위치(예: 지사명, 층, 호실)를 지정하십시오. 기술자 현장 방문이 필요한 경우 유용합니다.',
            stepAssetTitle:    '관련 자산 / 기기',
            stepAssetDesc:     '문제가 발생한 하드웨어 또는 소프트웨어 자산(노트북, 데스크탑, 프린터 등)을 연결하십시오. 기술자가 대상 기기를 빠르게 파악할 수 있습니다.',
            stepRequesterTitle:'요청자',
            stepRequesterDesc: '티켓을 요청하는 사람(보통 본인)입니다. 타인을 대신하여 작성하는 경우에만 변경하십시오.',
            stepObserverTitle: '관찰자 (참조)',
            stepObserverDesc:  '이 티켓의 진행 상황을 이메일로 받아야 하는 동료를 추가하십시오. 담당자가 아닌 정보 공유 목적입니다.',
            stepAssigneeTitle: '담당자',
            stepAssigneeDesc:  '(선택 사항) 해결을 담당할 특정 기술자, 기술 그룹 또는 외부 공급업체를 직접 지정할 수 있습니다.',
            stepTitleTitle:    '제목',
            stepTitleDesc:     '문제를 짧고 명확하게 요약하십시오(예: "사무실 Wi-Fi에 노트북으로 연결 불가"). 좋은 제목은 신속한 분류에 도움이 됩니다.',
            stepDescTitle:     '상세 설명',
            stepDescDesc:      '가능한 한 자세히 설명하십시오. 오류 메시지, 발생 당시 수행 중이던 작업, 재현 절차를 포함하면 해결 속도가 빨라집니다.',
            stepAttachTitle:   '첨부 파일',
            stepAttachDesc:    '오류 스크린샷, 로그 파일, 하드웨어 손상 사진 등 관련 파일을 업로드하십시오. 해결 속도를 크게 높일 수 있습니다.',
            stepSubmitTitle:   '티켓 제출',
            stepSubmitDesc:    '내용을 확인하셨으면 "{button}" 버튼을 클릭하여 제출하십시오. 지원 팀에 알림이 전송되고 후속 조치가 시작됩니다.',
            stepContinueTitle: '다음 페이지',
            stepContinueDesc:  '이 페이지를 모두 작성하셨으면 "{button}" 버튼을 클릭하여 양식의 다음 부분으로 이동하십시오.',
            stepOtherTitle:    '질문',
            stepOtherDesc:     '이 질문에 답변하십시오. * 표시가 있는 질문은 필수입니다.',
            btnAddFallback:    '추가',
            ariaGuide:         '티켓 작성 가이드',
            ariaCloseGuide:    '가이드 닫기',
            ariaHelpButton:    '티켓 작성 가이드 시작',
            guideHint:         '무엇을 입력해야 할지 모르시나요?',
            guideButton:       '단계별 가이드',
            welcomeHide:       '다시 표시하지 않음',
        },

        vi: {
            welcomeTitle: 'Bạn cần trợ giúp tạo yêu cầu?',
            welcomeDesc:  'Chào mừng! Hãy để trình hướng dẫn từng bước giúp bạn điền vào biểu mẫu yêu cầu hỗ trợ này.',
            btnStart:  'Bắt đầu hướng dẫn',
            btnClose:  'Đóng',
            btnNext:   'Tiếp theo',
            btnBack:   'Quay lại',
            btnFinish: 'Hoàn thành',
            btnCreate: 'Tạo yêu cầu',
            warnMissing: '⚠ Vui lòng điền đầy đủ các trường bắt buộc (có dấu *) trước khi tạo yêu cầu.',

            stepTypeTitle:     'Loại yêu cầu',
            stepTypeDesc:      'Chọn xem đây là Sự cố (thứ gì đó bị hỏng và cần sửa) hay Yêu cầu (bạn cần thứ gì đó mới như cài phần mềm hoặc phần cứng mới).',
            stepCategoryTitle: 'Danh mục',
            stepCategoryDesc:  'Chọn danh mục mô tả tốt nhất vấn đề của bạn. Hệ thống sẽ tự động chuyển tiếp yêu cầu đến đúng nhóm kỹ thuật.',
            stepUrgencyTitle:  'Mức độ khẩn cấp',
            stepUrgencyDesc:   'Đặt mức khẩn cấp của vấn đề. Chỉ chọn "Rất cao" cho các sự cố nghiêm trọng làm tê liệt hoàn toàn hoạt động kinh doanh.',
            stepImpactTitle:   'Mức độ ảnh hưởng',
            stepImpactDesc:    'Chọn phạm vi ảnh hưởng. Chỉ ảnh hưởng đến cá nhân bạn, toàn phòng ban, hay toàn tổ chức?',
            stepPriorityTitle: 'Mức độ ưu tiên',
            stepPriorityDesc:  'Ưu tiên thường được tự động tính từ Khẩn cấp + Ảnh hưởng. Chỉ thay đổi thủ công khi có lý do cụ thể.',
            stepLocationTitle: 'Vị trí',
            stepLocationDesc:  'Chỉ định nơi xảy ra sự cố (ví dụ: văn phòng chi nhánh, tầng, phòng số). Hữu ích khi kỹ thuật viên cần đến trực tiếp.',
            stepAssetTitle:    'Tài sản / Thiết bị liên quan',
            stepAssetDesc:     'Liên kết tài sản phần cứng hoặc phần mềm bị ảnh hưởng (ví dụ: laptop, máy bàn hoặc máy in). Giúp kỹ thuật viên xác định đúng thiết bị.',
            stepRequesterTitle:'Người yêu cầu',
            stepRequesterDesc: 'Đây là người gửi yêu cầu (thường là bạn). Chỉ thay đổi khi bạn đang tạo yêu cầu thay mặt cho người khác.',
            stepObserverTitle: 'Người theo dõi',
            stepObserverDesc:  'Thêm đồng nghiệp cần nhận email cập nhật về tiến độ của yêu cầu này — họ không chịu trách nhiệm giải quyết, chỉ được thông báo.',
            stepAssigneeTitle: 'Người xử lý',
            stepAssigneeDesc:  '(Tùy chọn) Có thể chỉ định trực tiếp kỹ thuật viên, nhóm kỹ thuật hoặc nhà cung cấp bên ngoài chịu trách nhiệm xử lý.',
            stepTitleTitle:    'Tiêu đề',
            stepTitleDesc:     'Viết một tiêu đề ngắn gọn, rõ ràng (ví dụ: "Laptop không kết nối được Wi-Fi văn phòng"). Tiêu đề tốt giúp phân loại nhanh hơn.',
            stepDescTitle:     'Mô tả chi tiết',
            stepDescDesc:      'Mô tả vấn đề chi tiết nhất có thể: điều gì đã xảy ra, thông báo lỗi cụ thể, bạn đang làm gì lúc đó, và cách tái hiện lỗi.',
            stepAttachTitle:   'Tài liệu đính kèm',
            stepAttachDesc:    'Tải lên ảnh chụp màn hình lỗi, tệp nhật ký, hoặc ảnh hỏng hóc phần cứng. Điều này có thể giúp tăng đáng kể tốc độ giải quyết.',
            stepSubmitTitle:   'Gửi yêu cầu',
            stepSubmitDesc:    'Đã kiểm tra xong? Nhấp nút "{button}" để gửi yêu cầu. Nhóm hỗ trợ sẽ được thông báo và sẽ liên hệ lại với bạn.',
            stepContinueTitle: 'Trang tiếp theo',
            stepContinueDesc:  'Đã điền xong trang này? Nhấp nút "{button}" để chuyển sang phần tiếp theo của biểu mẫu.',
            stepOtherTitle:    'Câu hỏi',
            stepOtherDesc:     'Hãy trả lời câu hỏi này. Các câu hỏi có dấu * là bắt buộc.',
            btnAddFallback:    'Thêm',
            ariaGuide:         'Hướng dẫn tạo yêu cầu',
            ariaCloseGuide:    'Đóng hướng dẫn',
            ariaHelpButton:    'Bắt đầu hướng dẫn tạo yêu cầu',
            guideHint:         'Bạn chưa biết cần điền gì?',
            guideButton:       'Hướng dẫn từng bước',
            welcomeHide:       'Không hiển thị lại',
        },

        pt: {
            welcomeTitle: 'Precisa de ajuda para criar um chamado?',
            welcomeDesc:  'Bem-vindo! Deixe o nosso assistente guiado ajudar você a preencher o formulário de chamado passo a passo.',
            btnStart:  'Iniciar Guia',
            btnClose:  'Fechar',
            btnNext:   'Avançar',
            btnBack:   'Voltar',
            btnFinish: 'Concluir',
            btnCreate: 'Criar Chamado',
            warnMissing: '⚠ Preencha todos os campos obrigatórios (marcados com *) antes de criar o chamado.',

            stepTypeTitle:     'Tipo de Chamado',
            stepTypeDesc:      'Escolha se é um Incidente (algo está quebrado e precisa ser consertado) ou uma Requisição (você precisa de algo novo, como instalação de software ou hardware).',
            stepCategoryTitle: 'Categoria',
            stepCategoryDesc:  'Selecione a categoria que melhor descreve o seu problema. Isso direciona o chamado automaticamente para a equipe técnica correta.',
            stepUrgencyTitle:  'Urgência',
            stepUrgencyDesc:   'Defina a urgência da resolução. Reserve "Muito Alta" para falhas críticas que bloqueiam completamente as operações do negócio.',
            stepImpactTitle:   'Impacto',
            stepImpactDesc:    'Selecione o escopo do impacto. Afeta apenas você, todo o seu departamento ou a organização inteira?',
            stepPriorityTitle: 'Prioridade',
            stepPriorityDesc:  'A prioridade é normalmente calculada automaticamente com base na Urgência e no Impacto. Altere manualmente somente se houver motivo específico.',
            stepLocationTitle: 'Localização',
            stepLocationDesc:  'Especifique onde o problema está ocorrendo (ex: filial, andar ou número da sala), para que um técnico possa visitá-lo se necessário.',
            stepAssetTitle:    'Ativo / Dispositivo Associado',
            stepAssetDesc:     'Vincule o hardware ou software afetado (ex: notebook, desktop ou impressora). Isso ajuda os técnicos a identificar exatamente qual dispositivo está com problema.',
            stepRequesterTitle:'Requerente',
            stepRequesterDesc: 'Essa é a pessoa que está abrindo o chamado (genericamente você). Altere somente se estiver abrindo em nome de outra pessoa.',
            stepObserverTitle: 'Observador (Acompanhador)',
            stepObserverDesc:  'Adicione colegas que devem receber atualizações por e-mail sobre o andamento do chamado — eles não serão responsáveis, apenas mantidos informados.',
            stepAssigneeTitle: 'Atribuído A',
            stepAssigneeDesc:  '(Opcional) Atribua o chamado diretamente a um técnico específico, grupo técnico ou fornecedor externo que irá resolver.',
            stepTitleTitle:    'Título',
            stepTitleDesc:     'Escreva um resumo curto e claro do problema (ex: "Notebook não conecta ao Wi-Fi do escritório"). Um bom título agiliza a triagem.',
            stepDescTitle:     'Descrição',
            stepDescDesc:      'Descreva o problema com o máximo de detalhes possível: o que aconteceu, mensagens de erro, o que você estava fazendo e como reproduzir.',
            stepAttachTitle:   'Anexos',
            stepAttachDesc:    'Faça upload de capturas de tela de erros, logs ou fotos de danos em hardware. Isso pode acelerar significativamente a resolução.',
            stepSubmitTitle:   'Enviar Chamado',
            stepSubmitDesc:    'Tudo certo? Clique em "{button}" para enviar o chamado. A equipe de suporte será notificada e entrará em contato com você.',
            stepContinueTitle: 'Próxima Página',
            stepContinueDesc:  'Terminou esta página? Clique em "{button}" para ir para a próxima parte do formulário.',
            stepOtherTitle:    'Pergunta',
            stepOtherDesc:     'Responda a esta pergunta. As perguntas marcadas com * são obrigatórias.',
            btnAddFallback:    'Adicionar',
            ariaGuide:         'Guia de criação de chamados',
            ariaCloseGuide:    'Fechar guia',
            ariaHelpButton:    'Iniciar o guia de criação de chamados',
            guideHint:         'Não sabe o que preencher?',
            guideButton:       'Guia passo a passo',
            welcomeHide:       'Não mostrar novamente',
        },

        it: {
            welcomeTitle: 'Serve aiuto per creare un ticket?',
            welcomeDesc:  'Benvenuto! La nostra procedura guidata ti aiuterà a compilare il modulo del ticket passo dopo passo.',
            btnStart:  'Avvia Guida',
            btnClose:  'Chiudi',
            btnNext:   'Avanti',
            btnBack:   'Indietro',
            btnFinish: 'Fine',
            btnCreate: 'Crea Ticket',
            warnMissing: '⚠ Compila tutti i campi obbligatori (contrassegnati con *) prima di creare il ticket.',

            stepTypeTitle:     'Tipo di Ticket',
            stepTypeDesc:      'Scegli se si tratta di un Incidente (qualcosa è rotto e va riparato) o di una Richiesta (hai bisogno di qualcosa di nuovo, come l\'installazione di software o nuovo hardware).',
            stepCategoryTitle: 'Categoria',
            stepCategoryDesc:  'Seleziona la categoria che descrive meglio il tuo problema. Il ticket verrà indirizzato automaticamente al team tecnico corretto.',
            stepUrgencyTitle:  'Urgenza',
            stepUrgencyDesc:   'Imposta il livello di urgenza. Riserva "Molto Alta" solo per guasti critici che bloccano completamente le attività aziendali.',
            stepImpactTitle:   'Impatto',
            stepImpactDesc:    'Seleziona lo scope dell\'impatto. Riguarda solo te, l\'intero reparto o tutta l\'organizzazione?',
            stepPriorityTitle: 'Priorità',
            stepPriorityDesc:  'La priorità viene di norma calcolata automaticamente da Urgenza + Impatto. Modificala manualmente solo se hai un motivo specifico.',
            stepLocationTitle: 'Posizione',
            stepLocationDesc:  'Specifica dove si verifica il problema (es. sede, piano o numero stanza), in modo che un tecnico possa intervenire di persona se necessario.',
            stepAssetTitle:    'Elemento Associato / Dispositivo',
            stepAssetDesc:     'Collega l\'hardware o il software interessato (es. laptop, desktop o stampante). Aiuta i tecnici a identificare esattamente quale dispositivo ha il problema.',
            stepRequesterTitle:'Richiedente',
            stepRequesterDesc: 'È la persona che apre il ticket (di solito tu). Cambia solo se stai aprendo il ticket per conto di un\'altra persona.',
            stepObserverTitle: 'Osservatore',
            stepObserverDesc:  'Aggiungi colleghi che devono ricevere aggiornamenti via e-mail sullo stato del ticket — non ne saranno responsabili, verranno solo tenuti informati.',
            stepAssigneeTitle: 'Assegnato A',
            stepAssigneeDesc:  '(Facoltativo) Assegna il ticket direttamente a un tecnico specifico, a un gruppo tecnico o a un fornitore esterno che lo risolverà.',
            stepTitleTitle:    'Titolo',
            stepTitleDesc:     'Scrivi un riassunto breve e chiaro del problema (es. "Il laptop non si connette al Wi-Fi dell\'ufficio"). Un buon titolo velocizza il triage.',
            stepDescTitle:     'Descrizione',
            stepDescDesc:      'Descrivi il problema nel maggior dettaglio possibile: cosa è successo, dettagli sugli errori, cosa stavi facendo e come riprodurlo.',
            stepAttachTitle:   'Allegati',
            stepAttachDesc:    'Carica screenshot degli errori, file di log o foto di danni hardware. Questo può accelerare notevolmente la risoluzione.',
            stepSubmitTitle:   'Invia Ticket',
            stepSubmitDesc:    'Tutto a posto? Clicca su "{button}" per inviare il ticket. Il team di supporto riceverà una notifica e ti risponderà.',
            stepContinueTitle: 'Pagina Successiva',
            stepContinueDesc:  'Hai finito questa pagina? Clicca su "{button}" per passare alla parte successiva del modulo.',
            stepOtherTitle:    'Domanda',
            stepOtherDesc:     'Rispondi a questa domanda. Le domande contrassegnate con * sono obbligatorie.',
            btnAddFallback:    'Aggiungi',
            ariaGuide:         'Guida alla creazione del ticket',
            ariaCloseGuide:    'Chiudi la guida',
            ariaHelpButton:    'Avvia la guida alla creazione del ticket',
            guideHint:         'Non sai cosa compilare?',
            guideButton:       'Guida passo passo',
            welcomeHide:       'Non mostrare più',
        },
    };

    /* ------------------------------------------------------------------ */
    /*  DEFAULT STEP VISIBILITY                                             */
    /*  Used until the admin settings load, and as the fallback if the      */
    /*  settings endpoint is unreachable. Mirrors the defaults in           */
    /*  ajax/config.php and front/config.php.                               */
    /* ------------------------------------------------------------------ */
    const DEFAULT_CONFIG = {
        step_type: '1', step_category: '1', step_urgency: '1', step_impact: '1',
        step_priority: '1', step_location: '1', step_asset: '1', step_requester: '1',
        step_observer: '1', step_assignee: '1', step_title: '1', step_description: '1',
        step_attachments: '1', step_other: '1', step_submit: '1'
    };

    /* ------------------------------------------------------------------ */
    /*  SERVICE CATALOG QUESTIONS (GLPI 11 simplified interface)           */
    /*  GLPI 11 creates simplified-interface tickets through service       */
    /*  catalog forms. ajax/config.php says which ticket field each        */
    /*  question fills, as a settings key; the question then gets the      */
    /*  same advice as that field on the ticket form. Questions matching   */
    /*  no field use 'step_other'.                                         */
    /* ------------------------------------------------------------------ */
    const QUESTION_DESCRIPTIONS = {
        step_type:        'stepTypeDesc',
        step_category:    'stepCategoryDesc',
        step_urgency:     'stepUrgencyDesc',
        step_location:    'stepLocationDesc',
        step_asset:       'stepAssetDesc',
        step_requester:   'stepRequesterDesc',
        step_observer:    'stepObserverDesc',
        step_assignee:    'stepAssigneeDesc',
        step_title:       'stepTitleDesc',
        step_description: 'stepDescDesc',
        step_attachments: 'stepAttachDesc'
    };

    /* ------------------------------------------------------------------ */
    /*  PLUGIN URL                                                          */
    /*  e.g. "/glpi/plugins/ticketwizard", or ".../marketplace/..." on      */
    /*  GLPI 10. Taken from this script's own URL, so the settings request */
    /*  works wherever GLPI and the plugin are installed.                  */
    /*  (document.currentScript is only set while the script first runs.)  */
    /* ------------------------------------------------------------------ */
    const PLUGIN_URL = (function () {
        const src = (document.currentScript && document.currentScript.src) || '';
        const m = src.match(/^(.*?)\/(?:public\/)?js\/wizard\.js(?:[?#].*)?$/);
        if (m) return m[1];
        return (window.CFG_GLPI ? window.CFG_GLPI.root_doc : '') + '/plugins/ticketwizard';
    })();

    /* ------------------------------------------------------------------ */
    /*  STATE                                                               */
    /* ------------------------------------------------------------------ */
    let currentStep      = 0;
    let tourSteps        = [];
    let welcomePopup     = null;
    let wizardPopup      = null;
    let highlightedEl    = null;
    let isInitialized    = false;
    let intervalId       = null;
    let lastUrl          = location.href;
    let requiredErrorEls = [];   // fields currently marked with the red "missing required" ring
    let pageType         = null; // 'ticket' or 'catalog', see getPageType()
    let wizardConfig     = null; // { steps, questions } from ajax/config.php

    /* ------------------------------------------------------------------ */
    /*  LANGUAGE DETECTION                                                  */
    /* ------------------------------------------------------------------ */
    function getLanguage() {
        const raw = (document.documentElement.lang || navigator.language || 'en').toLowerCase();
        const code = raw.replace('_', '-').split('-')[0];
        return TRANSLATIONS[code] ? code : 'en';
    }

    /* ------------------------------------------------------------------ */
    /*  SESSION STORAGE                                                     */
    /*  Throws when the browser blocks storage: the guide then just         */
    /*  doesn't resume after a reload.                                      */
    /* ------------------------------------------------------------------ */
    function storageGet(key) {
        try { return sessionStorage.getItem(key); } catch (e) { return null; }
    }

    function storageSet(key, value) {
        try { sessionStorage.setItem(key, value); } catch (e) { /* ignore */ }
    }

    function storageRemove(key) {
        try { sessionStorage.removeItem(key); } catch (e) { /* ignore */ }
    }

    // "Don't show this again" on the welcome popup: remembered in this
    // browser (localStorage, so across tabs and sessions). The guide bar
    // still starts the guide.
    const WELCOME_HIDDEN_KEY = 'tw_welcome_hidden';

    function isWelcomeHidden() {
        try { return localStorage.getItem(WELCOME_HIDDEN_KEY) === '1'; } catch (e) { return false; }
    }

    function hideWelcomeForGood() {
        try { localStorage.setItem(WELCOME_HIDDEN_KEY, '1'); } catch (e) { /* ignore */ }
    }

    /* ------------------------------------------------------------------ */
    /*  ELEMENT RESOLUTION — handle Select2, TinyMCE, hidden inputs        */
    /* ------------------------------------------------------------------ */
    function getVisibleElement(el) {
        if (!el) return null;

        // Select2
        if (el.tagName === 'SELECT') {
            const sibling = el.nextElementSibling;
            if (sibling && sibling.classList.contains('select2-container')) {
                return sibling;
            }
            const ancestor = el.closest('.select2-container');
            if (ancestor) return ancestor;
        }

        // TinyMCE: the editor box, which TinyMCE inserts right after the
        // textarea it hides. Looked up per textarea, as a page can have several.
        if (el.tagName === 'TEXTAREA') {
            const next = el.nextElementSibling;
            if (next && next.classList.contains('tox-tinymce')) return next;
            if (el.id) {
                const ed = window.tinymce && window.tinymce.get && window.tinymce.get(el.id);
                if (ed && ed.getContainer && ed.getContainer()) return ed.getContainer();
                const legacy = document.getElementById(el.id + '_parent');   // TinyMCE 4
                if (legacy) return legacy;
            }
        }

        // Hidden input fallback
        const cs = window.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') {
            const row = el.closest('.mb-3, .form-group, .row, .ticket-form-actor-container');
            if (row && window.getComputedStyle(row).display !== 'none') return row;
        }

        return el;
    }

    function isVisible(el) {
        if (!el) return false;
        const proxy = getVisibleElement(el);
        if (!proxy) return false;
        const rect  = proxy.getBoundingClientRect();
        const style = window.getComputedStyle(proxy);
        return (
            rect.width  > 0 &&
            rect.height > 0 &&
            style.display    !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity    !== '0'
        );
    }

    /* ------------------------------------------------------------------ */
    /*  FIELD EMPTY / MISSING VALUE DETECTOR                                */
    /* ------------------------------------------------------------------ */
    function isFieldEmpty(el) {
        if (!el) return true;

        // If it's a select element
        if (el.tagName === 'SELECT') {
            const val = el.value;
            return val === '' || val === '0' || val === null || val === undefined;
        }

        // TinyMCE-backed rich text (Description / content): the underlying
        // <textarea> is not updated until form submit, so read the LIVE editor
        // content instead — otherwise a typed description looks "empty".
        if (el.tagName === 'TEXTAREA') {
            if (window.tinymce && el.id) {
                const ed = window.tinymce.get(el.id);
                if (ed) {
                    const txt = ed.getContent({ format: 'text' }) || '';
                    return txt.replace(/ /g, ' ').trim() === '';
                }
            }
            return el.value.trim() === '';
        }

        // Plain input
        if (el.tagName === 'INPUT') {
            return el.value.trim() === '';
        }

        // For GLPI actor block widgets
        const select = el.querySelector('select');
        if (select) {
            const val = select.value;
            return val === '' || val === '0' || val === null || val === undefined;
        }

        const inputs = el.querySelectorAll('input[type="hidden"], input[type="text"]');
        if (inputs.length > 0) {
            let allEmpty = true;
            for (let input of inputs) {
                if (input.value && input.value !== '0' && input.value !== '') {
                    allEmpty = false;
                    break;
                }
            }
            return allEmpty;
        }

        return false;
    }

    // A service catalog question (its whole <section>) has no answer yet.
    // Unknown kinds of questions count as answered: GLPI checks required
    // questions itself when the form is sent, so never block on a guess.
    function isQuestionEmpty(question) {
        // Long text (rich text editor)
        const textarea = question.querySelector('textarea');
        if (textarea) return isFieldEmpty(textarea);

        // Radio buttons and checkboxes
        const checks = question.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        if (checks.length > 0) {
            return !Array.prototype.some.call(checks, function (c) { return c.checked; });
        }

        // Dropdowns, single or multiple. Item questions can have a type
        // dropdown before the item dropdown: the item is the answer.
        const select = question.querySelector('select[name$="[items_id]"]') || question.querySelector('select');
        if (select) {
            return !Array.prototype.some.call(select.selectedOptions, function (o) {
                return o.value !== '' && o.value !== '0';
            });
        }

        // File uploads: GLPI adds a hidden "_<name>[]" input per uploaded file
        const fileInput = question.querySelector('input[type="file"]');
        if (fileInput) {
            return !Array.prototype.some.call(
                question.querySelectorAll('input[type="hidden"]'),
                function (i) { return i.name.charAt(0) === '_' && i.value !== ''; }
            );
        }

        // Text, number, email, date...
        const inputs = question.querySelectorAll('input:not([type="hidden"]):not(.select2-search__field)');
        if (inputs.length > 0) {
            return !Array.prototype.some.call(inputs, function (i) { return i.value.trim() !== ''; });
        }

        return false;
    }

    function isStepEmpty(step) {
        return step.isQuestion ? isQuestionEmpty(step.element) : isFieldEmpty(step.element);
    }

    /* ------------------------------------------------------------------ */
    /*  REQUIRED FIELD DETECTION                                            */
    /*  GLPI marks mandatory fields with <span class="required">*</span>   */
    /*  in the field label, or with a native `required` attribute.         */
    /* ------------------------------------------------------------------ */
    function isFieldRequired(el) {
        if (!el) return false;

        // Native HTML required attribute (on the field or a descendant control).
        if (el.required === true) return true;
        if (el.querySelector && el.querySelector('[required]')) return true;

        // GLPI marks mandatory fields with <span class="required">*</span> in the
        // field label. Scope the search to THIS field's row so a required marker
        // belonging to a neighbouring field can't produce a false positive.
        const row = el.closest('.form-field, .mb-3, .form-group, .row, tr, li') || el.parentElement;
        if (row && row.querySelector) {
            if (row.querySelector('span.required, .required, [data-glpi-required]')) return true;
        }
        return false;
    }

    // Locate a GLPI actor block (requester / observer / assign) container.
    function findActorBlock(type) {
        return document.querySelector('[data-actor-type="' + type + '"]')
            || document.querySelector('.actor-bloc[data-field="_users_id_' + type + '"]')
            || document.querySelector('input[name="_users_id_' + type + '[0][items_id]"]')
            || document.querySelector('[name*="_users_id_' + type + '"]');
    }

    // Translate with English fallback for keys that may be missing in a locale.
    function tr(t, key) {
        return (t && t[key]) || TRANSLATIONS.en[key] || '';
    }

    // Put a button's label, as GLPI shows it in the user's language, into an
    // instruction such as 'Click the "{button}" button to submit your ticket.'
    function withButtonLabel(text, button, t) {
        const label = ((button && button.textContent) || '').replace(/\s+/g, ' ').trim()
            || (button && (button.value || button.getAttribute('aria-label')))
            || tr(t, 'btnAddFallback');
        return text.replace('{button}', label);
    }

    // A service catalog question's label as the form shows it, without the
    // required marker.
    function getQuestionLabel(question) {
        const heading = question.querySelector('h3');
        if (!heading) return question.getAttribute('aria-label') || '';
        const copy = heading.cloneNode(true);
        copy.querySelectorAll('.text-danger').forEach(function (marker) { marker.remove(); });
        return copy.textContent.replace(/\s+/g, ' ').trim();
    }

    // The description the form's author wrote under a question, kept short.
    function getQuestionDescription(question) {
        const block = question.querySelector('.block-description');
        const text = block ? block.textContent.replace(/\s+/g, ' ').trim() : '';
        return text.length > 280 ? text.slice(0, 277) + '…' : text;
    }

    /* ------------------------------------------------------------------ */
    /*  MISSING REQUIRED FIELDS — validation + red ring marking            */
    /* ------------------------------------------------------------------ */
    function getMissingRequiredFields() {
        const missing = [];
        tourSteps.forEach(function (s) {
            if (s.required && !s.isSubmit && !s.isContinue && isVisible(s.element) && isStepEmpty(s)) {
                missing.push(s.element);
            }
        });
        return missing;
    }

    function clearMissingRequired() {
        requiredErrorEls.forEach(function (el) {
            const proxy = getVisibleElement(el) || el;
            if (proxy && proxy.classList) proxy.classList.remove('tw-required-missing');
        });
        requiredErrorEls = [];
    }

    function markMissingRequired(list) {
        clearMissingRequired();
        list.forEach(function (el) {
            const proxy = getVisibleElement(el) || el;
            if (proxy && proxy.classList) {
                proxy.classList.add('tw-required-missing');
                requiredErrorEls.push(el);
            }
        });
    }

    function showRequiredWarning(lang) {
        if (!wizardPopup) return;
        const w = wizardPopup.querySelector('#tw-warn');
        if (!w) return;
        w.textContent = tr(TRANSLATIONS[lang] || TRANSLATIONS.en, 'warnMissing');
        w.style.display = 'block';
    }

    function hideRequiredWarning() {
        if (!wizardPopup) return;
        const w = wizardPopup.querySelector('#tw-warn');
        if (w) w.style.display = 'none';
    }

    // TinyMCE edits happen inside an iframe and never reach the document, so bind
    // to the editor directly: re-validate required fields as the user types, and
    // keep the underlying <textarea> synced.
    function bindTinyMceEditor(ed) {
        if (!ed || ed._twBound) return;
        ed._twBound = true;
        ed.on('keyup change input SetContent Undo Redo', function () {
            try { ed.save(); } catch (e) { /* ignore */ }
            updateHighlightColor();
            refreshRequiredMarks();
        });
    }

    function setupTinyMceWatchers() {
        if (!window.tinymce) return;
        try {
            // tinymce.get() lists every editor; TinyMCE 6+ (GLPI 10 and 11
            // ship 7) no longer has the old tinymce.editors array.
            const editors = typeof window.tinymce.get === 'function'
                ? window.tinymce.get()
                : window.tinymce.editors;
            (editors || []).forEach(bindTinyMceEditor);
            if (!window.__twTinymceWatched && typeof window.tinymce.on === 'function') {
                window.__twTinymceWatched = true;
                window.tinymce.on('AddEditor', function (e) { bindTinyMceEditor(e.editor); });
            }
        } catch (err) { /* ignore */ }
    }

    // On the final step (submit, or a form's "Continue"), keep the red rings
    // + warning in sync as the user fills fields in. Called from input/change
    // listeners.
    function refreshRequiredMarks() {
        if (!wizardPopup || !tourSteps.length) return;
        const step = tourSteps[currentStep];
        if (!step || !(step.isSubmit || step.isContinue)) return;
        const missing = getMissingRequiredFields();
        markMissingRequired(missing);
        if (missing.length > 0) {
            showRequiredWarning(getLanguage());
        } else {
            hideRequiredWarning();
        }
    }

    /* ------------------------------------------------------------------ */
    /*  BUILD STEP LIST (Filters hidden steps using Admin settings)       */
    /*  Each step has a `key` that stays the same when the list is rebuilt */
    /*  (fields can appear or disappear as the user fills the form in).    */
    /* ------------------------------------------------------------------ */
    function buildTourSteps(lang) {
        const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
        const config = (wizardConfig && wizardConfig.steps) || DEFAULT_CONFIG;
        if (pageType === 'catalog') {
            return buildCatalogSteps(t, config, (wizardConfig && wizardConfig.questions) || {});
        }
        return buildTicketSteps(t, config);
    }

    // The ticket form: the standard interface (GLPI 10 and 11), and GLPI 10's
    // simplified interface.
    function buildTicketSteps(t, config) {
        const steps = [];

        // Add a step when the field is visible AND either the admin left it
        // enabled OR the field is REQUIRED (* mandatory fields are never skipped,
        // even if hidden in the admin settings).
        const addStep = (configKey, el, title, desc, extra) => {
            extra = extra || {};
            if (!el || !isVisible(el)) return;
            // Some fields (e.g. the attachments dropzone) are inherently optional and
            // live in a wide container, so required-marker detection is unreliable —
            // callers can force them optional to avoid false "required" flags.
            const required = extra.optional === true ? false : isFieldRequired(el);
            if (config[configKey] === '0' && !required) return;
            steps.push({ key: configKey, element: el, title: title, desc: desc, required: required });
        };

        // 1. Ticket Type
        addStep('step_type', document.querySelector('select[name="type"]'), t.stepTypeTitle, t.stepTypeDesc);

        // 2. Category
        addStep('step_category', document.querySelector('select[name="itilcategories_id"]'), t.stepCategoryTitle, t.stepCategoryDesc);

        // 3. Urgency
        addStep('step_urgency', document.querySelector('select[name="urgency"]'), t.stepUrgencyTitle, t.stepUrgencyDesc);

        // 4. Impact
        addStep('step_impact', document.querySelector('select[name="impact"]'), t.stepImpactTitle, t.stepImpactDesc);

        // 5. Priority
        addStep('step_priority', document.querySelector('select[name="priority"]'), t.stepPriorityTitle, t.stepPriorityDesc);

        // 6. Location
        addStep('step_location', document.querySelector('select[name="locations_id"]'), t.stepLocationTitle, t.stepLocationDesc);

        // 7. Associated asset (first visible items_id dropdown)
        let assetEl = null;
        document.querySelectorAll('select[name^="items_id"]').forEach(function (c) {
            if (!assetEl && isVisible(c)) assetEl = c;
        });
        addStep('step_asset', assetEl, t.stepAssetTitle, t.stepAssetDesc);

        // 8. Requester actor block
        addStep('step_requester', findActorBlock('requester'), t.stepRequesterTitle, t.stepRequesterDesc);

        // 9. Observer actor block
        addStep('step_observer', findActorBlock('observer'), t.stepObserverTitle, t.stepObserverDesc);

        // 10. Assigned-to actor block
        addStep('step_assignee', findActorBlock('assign'), t.stepAssigneeTitle, t.stepAssigneeDesc);

        // 11. Title field
        addStep('step_title',
            document.querySelector('input[name="name"][type="text"]') || document.querySelector('input[name="name"]'),
            t.stepTitleTitle, t.stepTitleDesc);

        // 12. Description
        addStep('step_description', document.querySelector('textarea[name="content"]'), t.stepDescTitle, t.stepDescDesc);

        // 13. Attachments: the drop zone around the file input (".fileupload"
        //     in GLPI 10 and 11; the editor's own hidden uploader is skipped)
        let attachEl = null;
        document.querySelectorAll('.fileupload:not(.only-uploaded-files), .dropzone, input[type="file"]').forEach(function (c) {
            if (!attachEl && isVisible(c)) attachEl = c;
        });
        addStep('step_attachments', attachEl, t.stepAttachTitle, t.stepAttachDesc, { optional: true });

        // 14. Submit / Add button — the final step, so the guide ends on the
        //     "Create Ticket" button, unless the admin hid it in the settings.
        const btn =
            document.querySelector('button[name="add"]') ||
            document.querySelector('input[type="submit"][name="add"]') ||
            document.querySelector('input[name="add"]');
        if (btn && isVisible(btn) && config.step_submit !== '0') {
            steps.push({
                key: 'step_submit', element: btn, title: t.stepSubmitTitle,
                desc: withButtonLabel(tr(t, 'stepSubmitDesc'), btn, t), required: false, isSubmit: true
            });
        }

        return steps;
    }

    // A GLPI 11 service catalog form: one step per question on screen, then
    // the button that moves on.
    function buildCatalogSteps(t, config, questionSteps) {
        const steps = [];
        const form = getCatalogForm();
        if (!form) return steps;

        form.querySelectorAll('[data-glpi-form-renderer-question]').forEach(function (question) {
            // Skip questions on another page of the form, or hidden by its
            // conditions until another answer needs them.
            if (!isVisible(question)) return;

            const id = question.dataset.glpiFormRendererId;
            const configKey = questionSteps[id] || 'step_other';
            const required = !!question.querySelector('h3 .text-danger');
            if (config[configKey] === '0' && !required) return;

            const descKey = QUESTION_DESCRIPTIONS[configKey];
            steps.push({
                key: 'question_' + id,
                element: question,
                isQuestion: true,
                title: getQuestionLabel(question) || tr(t, 'stepOtherTitle'),
                desc: descKey ? tr(t, descKey) : (getQuestionDescription(question) || tr(t, 'stepOtherDesc')),
                required: required
            });
        });

        // Last step: "Continue" to the next page of a multi-page form, or
        // "Submit" on its last page (unless the admin hid the submit step).
        const next = form.querySelector('[data-glpi-form-renderer-action="next-section"]');
        const submit = form.querySelector('[data-glpi-form-renderer-action="submit"]');
        if (next && isVisible(next)) {
            steps.push({
                key: 'step_continue', element: next, title: tr(t, 'stepContinueTitle'),
                desc: withButtonLabel(tr(t, 'stepContinueDesc'), next, t), required: false, isContinue: true
            });
        } else if (submit && isVisible(submit) && config.step_submit !== '0') {
            steps.push({
                key: 'step_submit', element: submit, title: t.stepSubmitTitle,
                desc: withButtonLabel(tr(t, 'stepSubmitDesc'), submit, t), required: false, isSubmit: true
            });
        }

        return steps;
    }

    // Rebuild the step list and find the step with the given key in it.
    function refreshSteps(lang, key) {
        tourSteps = buildTourSteps(lang);
        for (let i = 0; i < tourSteps.length; i++) {
            if (tourSteps[i].key === key) return i;
        }
        return -1;
    }

    /* ------------------------------------------------------------------ */
    /*  POSITIONING                                                         */
    /* ------------------------------------------------------------------ */
    // `sideEl`, when given, is what the popup sits beside (left or right);
    // above or below, it clears the whole `targetEl`.
    function positionPopup(targetEl, popupEl, sideEl) {
        if (!targetEl || !popupEl) return;

        // Increased MARGIN (from 12 to 24) to ensure the instruction popup
        // is clearly outside the active selection areas
        const MARGIN = 24;
        const PADDING = 10;

        // Named `rect`, not `tr` — `tr()` is this module's translation helper and
        // shadowing it here would silently break any future call to it.
        const rect = targetEl.getBoundingClientRect();
        const side = (sideEl || targetEl).getBoundingClientRect();
        const pw = popupEl.offsetWidth  || 320;
        const ph = popupEl.offsetHeight || 200;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const spaceBelow = vh - rect.bottom;
        const spaceAbove = rect.top;
        const spaceRight = vw - side.right;
        const spaceLeft  = side.left;

        let top, left, placement;

        // Check if the target element is a select or Select2 dropdown container.
        // For dropdown lists, we prefer placing the modal to the RIGHT or LEFT (sideways)
        // so that when the dropdown list opens below (or above), it doesn't overlap the modal.
        const preferSide = targetEl.classList.contains('select2-container') ||
                           targetEl.tagName === 'SELECT' ||
                           targetEl.querySelector('select') !== null;

        if (pageType === 'catalog') {
            // Service catalog forms are one column of questions: beside the
            // answer field is best, then above (over questions already
            // answered) rather than below (over the next one).
            if (spaceRight >= pw + MARGIN) {
                placement = 'right';
                left = side.right + MARGIN;
                top  = side.top + (side.height - ph) / 2;
            } else if (spaceLeft >= pw + MARGIN) {
                placement = 'left';
                left = side.left - pw - MARGIN;
                top  = side.top + (side.height - ph) / 2;
            } else if (spaceAbove >= ph + MARGIN) {
                placement = 'top';
                top  = rect.top - ph - MARGIN;
                left = rect.left + (rect.width - pw) / 2;
            } else if (spaceBelow >= ph + MARGIN) {
                placement = 'bottom';
                top  = rect.bottom + MARGIN;
                left = rect.left + (rect.width - pw) / 2;
            } else {
                placement = 'center';
                top  = (vh - ph) / 2;
                left = (vw - pw) / 2;
            }
        } else if (preferSide) {
            if (spaceRight >= pw + MARGIN) {
                placement = 'right';
                left = side.right + MARGIN;
                top  = side.top + (side.height - ph) / 2;
            } else if (spaceLeft >= pw + MARGIN) {
                placement = 'left';
                left = side.left - pw - MARGIN;
                top  = side.top + (side.height - ph) / 2;
            } else if (spaceBelow >= ph + MARGIN) {
                placement = 'bottom';
                top  = rect.bottom + MARGIN;
                left = rect.left + (rect.width - pw) / 2;
            } else if (spaceAbove >= ph + MARGIN) {
                placement = 'top';
                top  = rect.top - ph - MARGIN;
                left = rect.left + (rect.width - pw) / 2;
            } else {
                placement = 'center';
                top  = (vh - ph) / 2;
                left = (vw - pw) / 2;
            }
        } else {
            // Default placement priority for standard fields (below, above, right, left)
            if (spaceBelow >= ph + MARGIN) {
                placement = 'bottom';
                top  = rect.bottom + MARGIN;
                left = rect.left + (rect.width - pw) / 2;
            } else if (spaceAbove >= ph + MARGIN) {
                placement = 'top';
                top  = rect.top - ph - MARGIN;
                left = rect.left + (rect.width - pw) / 2;
            } else if (spaceRight >= pw + MARGIN) {
                placement = 'right';
                left = side.right + MARGIN;
                top  = side.top + (side.height - ph) / 2;
            } else if (spaceLeft >= pw + MARGIN) {
                placement = 'left';
                left = side.left - pw - MARGIN;
                top  = side.top + (side.height - ph) / 2;
            } else {
                placement = 'center';
                top  = (vh - ph) / 2;
                left = (vw - pw) / 2;
            }
        }

        left = Math.max(PADDING, Math.min(vw - pw - PADDING, left));
        top  = Math.max(PADDING, Math.min(vh - ph - PADDING, top));

        popupEl.style.top  = `${top}px`;
        popupEl.style.left = `${left}px`;

        setArrow(popupEl, placement);
    }

    function setArrow(popupEl, placement) {
        const arrow = popupEl.querySelector('.tw-arrow');
        if (!arrow) return;

        arrow.className = 'tw-arrow';
        arrow.style.display = 'none';

        if (placement === 'center') return;

        arrow.style.display = 'block';
        arrow.classList.add(`tw-arrow-placement-${placement}`);
    }

    // What the popup sits beside: for a service catalog question, its answer
    // field rather than the whole question, since most fields are narrower
    // and leave room next to them. Radio buttons and the like: the question.
    function getSideAnchor(step) {
        if (!step || !step.isQuestion) return null;
        const fields = step.element.querySelectorAll(
            'select, textarea, .fileupload:not(.only-uploaded-files), ' +
            'input[type="text"], input[type="email"], input[type="number"], ' +
            'input[type="date"], input[type="datetime-local"], input[type="time"]'
        );
        for (const field of fields) {
            if (isVisible(field)) return getVisibleElement(field);
        }
        return null;
    }

    /* ------------------------------------------------------------------ */
    /*  HIGHLIGHT & ERROR OUTLINE CONTROLLER                                */
    /* ------------------------------------------------------------------ */
    function removeHighlight() {
        if (highlightedEl) {
            highlightedEl.classList.remove('tw-highlight');
            highlightedEl.classList.remove('tw-highlight-error');
            highlightedEl = null;
        }
    }

    function updateHighlightColor() {
        if (!highlightedEl || !tourSteps[currentStep]) return;
        const step = tourSteps[currentStep];

        // Default highlight is ORANGE. Turn RED only when the step is a REQUIRED
        // field that is still missing data. Optional fields always stay orange,
        // even when empty.
        if (step.required && isStepEmpty(step)) {
            highlightedEl.classList.remove('tw-highlight');
            highlightedEl.classList.add('tw-highlight-error');
        } else {
            highlightedEl.classList.remove('tw-highlight-error');
            highlightedEl.classList.add('tw-highlight');
        }
    }

    /* ------------------------------------------------------------------ */
    /*  TOUR STATE                                                          */
    /*  Where the guide is, so it resumes after GLPI reloads the form (it  */
    /*  does when the user changes Type or Category). Tied to the page, so */
    /*  it never resumes on a different one.                               */
    /* ------------------------------------------------------------------ */
    function saveTourState() {
        const step = tourSteps[currentStep];
        storageSet('tw_active', 'true');
        storageSet('tw_step', currentStep.toString());
        storageSet('tw_step_key', step ? step.key : '');
        storageSet('tw_page', location.pathname);
    }

    function resetTourState() {
        storageRemove('tw_active');
        storageRemove('tw_step');
        storageRemove('tw_step_key');
        storageRemove('tw_page');
    }

    /* ------------------------------------------------------------------ */
    /*  CLEANUP                                                             */
    /* ------------------------------------------------------------------ */
    function cleanup() {
        if (welcomePopup) {
            welcomePopup.remove();
            welcomePopup = null;
        }
        if (wizardPopup) {
            wizardPopup.remove();
            wizardPopup = null;
        }
        const bar = document.querySelector('.tw-guide-bar');
        if (bar) bar.remove();

        removeHighlight();
        clearMissingRequired();

        window.removeEventListener('resize', onReposition);
        window.removeEventListener('scroll', onReposition, true);
    }

    // Close the guide but keep the guide bar, so it can be started again.
    function closeGuide() {
        if (wizardPopup) {
            wizardPopup.remove();
            wizardPopup = null;
        }
        removeHighlight();
        clearMissingRequired();

        window.removeEventListener('resize', onReposition);
        window.removeEventListener('scroll', onReposition, true);

        createHelpButton(getLanguage());
    }

    function onReposition() {
        if (!wizardPopup || !tourSteps[currentStep]) return;
        const step = tourSteps[currentStep];
        positionPopup(getVisibleElement(step.element), wizardPopup, getSideAnchor(step));
    }

    // The page changed under the open guide: the user turned a page of a
    // multi-page form with GLPI's own buttons, a condition hid a question, or
    // a field went away. Follow it.
    function resyncSteps() {
        const l = getLanguage();
        const oldKeys = tourSteps.map(function (s) { return s.key; });
        tourSteps = buildTourSteps(l);
        if (tourSteps.length === 0) {
            closeGuide();
            return;
        }
        // None of the steps are the same on another page of a form: start
        // at its first question. Otherwise stay where the user was.
        const samePage = tourSteps.some(function (s) { return oldKeys.indexOf(s.key) !== -1; });
        showStep(samePage ? Math.min(currentStep, tourSteps.length - 1) : 0, l);
    }

    /* ------------------------------------------------------------------ */
    /*  SHOW STEP                                                           */
    /* ------------------------------------------------------------------ */
    function showStep(index, lang) {
        if (!wizardPopup || !tourSteps[index]) return;

        // Persist the current position so the tour resumes on the SAME step
        // after the form reloads (e.g. when the user changes Type or Category).
        currentStep = index;
        saveTourState();

        const t    = TRANSLATIONS[lang] || TRANSLATIONS.en;
        const step = tourSteps[index];
        const proxy = getVisibleElement(step.element);

        removeHighlight();

        if (proxy) {
            highlightedEl = proxy;
            updateHighlightColor();
            proxy.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }

        wizardPopup.querySelector('#tw-step-indicator').textContent =
            `${step.title}  ·  ${index + 1} / ${tourSteps.length}`;

        wizardPopup.querySelector('#tw-instruction-text').textContent = step.desc;

        const btnBack = wizardPopup.querySelector('#tw-btn-back');
        btnBack.style.display = index === 0 ? 'none' : '';

        // Label the primary button for what it does on the final step:
        // create the ticket, turn the form's page, or just end the guide.
        let nextLabel = t.btnNext;
        if (index === tourSteps.length - 1) {
            if (step.isSubmit) {
                nextLabel = tr(t, 'btnCreate');
            } else if (!step.isContinue) {
                nextLabel = tr(t, 'btnFinish');
            }
        }
        wizardPopup.querySelector('#tw-btn-next').textContent = nextLabel;

        // On the step that sends the form on, check the required fields.
        if (step.isSubmit || step.isContinue) {
            const missing = getMissingRequiredFields();
            markMissingRequired(missing);
            if (missing.length > 0) {
                showRequiredWarning(lang);
            } else {
                hideRequiredWarning();
            }
        } else {
            hideRequiredWarning();
            clearMissingRequired();
        }

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (!wizardPopup || !proxy) return;
                wizardPopup.classList.add('tw-visible');
                positionPopup(proxy, wizardPopup, getSideAnchor(step));
            });
        });
    }

    // The primary button on the final step.
    function finishTour(lang, step) {
        // Never create the ticket, or move a form on, while required fields
        // are empty — mark them with a red ring and warn instead.
        if (step && (step.isSubmit || step.isContinue)) {
            const missing = getMissingRequiredFields();
            if (missing.length > 0) {
                markMissingRequired(missing);
                showRequiredWarning(lang);
                // Bring the first missing field into view for the user.
                const firstProxy = getVisibleElement(missing[0]) || missing[0];
                if (firstProxy && firstProxy.scrollIntoView) {
                    firstProxy.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }
        }

        if (step && step.isContinue) {
            goToNextFormPage(step.element);
            return;
        }

        // All good — submit via the page's real button. Or, with no submit
        // step (hidden in the settings), just end the guide.
        resetTourState();
        closeGuide();
        if (step && step.isSubmit && typeof step.element.click === 'function') {
            step.element.click();
        }
    }

    // Turn the page of a multi-page service catalog form, then carry on with
    // the questions of the next page. GLPI checks this page's answers first;
    // if one is wrong it stays put and says why under the question.
    function goToNextFormPage(button) {
        const before = getFormPageSignature();
        hideRequiredWarning();
        button.click();

        let tries = 0;
        const timer = setInterval(function () {
            tries++;
            if (!wizardPopup) {
                clearInterval(timer);
            } else if (getFormPageSignature() !== before) {
                clearInterval(timer);
                const l = getLanguage();
                tourSteps = buildTourSteps(l);
                if (tourSteps.length > 0) {
                    showStep(0, l);
                } else {
                    closeGuide();
                }
            } else if (tries >= 50) {
                // ~10 s without a page change: the answers were rejected
                clearInterval(timer);
            }
        }, 200);
    }

    // Which page of a multi-page form is on screen.
    function getFormPageSignature() {
        const form = getCatalogForm();
        if (!form) return '';
        return Array.prototype.filter.call(
            form.querySelectorAll('[data-glpi-form-renderer-section]'),
            function (section) { return !section.classList.contains('d-none'); }
        ).map(function (section) { return section.dataset.glpiFormRendererSection; }).join(',');
    }

    /* ------------------------------------------------------------------ */
    /*  CREATE WIZARD POPUP                                                 */
    /* ------------------------------------------------------------------ */
    function createWizardPopup(lang) {
        if (wizardPopup) return;

        const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

        wizardPopup = document.createElement('div');
        wizardPopup.className = 'tw-popup-box';
        wizardPopup.setAttribute('role', 'dialog');
        wizardPopup.setAttribute('aria-modal', 'false');
        wizardPopup.setAttribute('aria-label', tr(t, 'ariaGuide'));

        wizardPopup.innerHTML = `
            <div class="tw-header">
                <span class="tw-step-indicator" id="tw-step-indicator"></span>
                <button type="button" class="tw-close-btn" id="tw-close-wizard"
                        aria-label="${tr(t, 'ariaCloseGuide')}" title="${tr(t, 'ariaCloseGuide')}">&times;</button>
            </div>
            <div class="tw-buttons-row">
                <button type="button" class="tw-btn tw-btn-back" id="tw-btn-back">${t.btnBack}</button>
                <button type="button" class="tw-btn tw-btn-next" id="tw-btn-next">${t.btnNext}</button>
            </div>
            <div class="tw-instruction-container">
                <p class="tw-instruction-text" id="tw-instruction-text"></p>
            </div>
            <p class="tw-warn" id="tw-warn"></p>
            <div class="tw-arrow" aria-hidden="true"></div>
        `;

        document.body.appendChild(wizardPopup);

        wizardPopup.querySelector('#tw-close-wizard').addEventListener('click', () => {
            resetTourState();
            closeGuide();
        });

        wizardPopup.querySelector('#tw-btn-back').addEventListener('click', () => {
            const l = getLanguage();
            const key = tourSteps[currentStep] && tourSteps[currentStep].key;
            let index = refreshSteps(l, key);
            if (tourSteps.length === 0) {
                closeGuide();
                return;
            }
            // The current step went away: go back from the place it had.
            if (index === -1) index = Math.min(currentStep, tourSteps.length);
            showStep(Math.max(0, index - 1), l);
        });

        wizardPopup.querySelector('#tw-btn-next').addEventListener('click', () => {
            const l = getLanguage();
            const key = tourSteps[currentStep] && tourSteps[currentStep].key;
            const index = refreshSteps(l, key);
            if (tourSteps.length === 0) {
                closeGuide();
                return;
            }
            if (index === -1) {
                // The current step went away: show what took its place rather
                // than skip ahead (and never submit without the user seeing it).
                showStep(Math.min(currentStep, tourSteps.length - 1), l);
            } else if (index < tourSteps.length - 1) {
                showStep(index + 1, l);
            } else {
                finishTour(l, tourSteps[index]);
            }
        });

        window.addEventListener('resize', onReposition);
        window.addEventListener('scroll', onReposition, true);
    }

    /* ------------------------------------------------------------------ */
    /*  START TOUR                                                          */
    /* ------------------------------------------------------------------ */
    function startTour(lang, stepIndex = 0) {
        createWizardPopup(lang);
        showStep(stepIndex, lang);
    }

    /* ------------------------------------------------------------------ */
    /*  GUIDE BAR (starts the guide, at the top of the form)                */
    /* ------------------------------------------------------------------ */
    // "Route" icon from Tabler Icons (MIT), inline so it doesn't depend on
    // the icon font version GLPI ships.
    const GUIDE_ICON = '<svg class="tw-guide-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M3 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M19 7a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z"/>' +
        '<path d="M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5"/></svg>';

    // Put the bar at the top of the form: under the title of a service
    // catalog form, just above a ticket form.
    function placeGuideBar(bar) {
        if (pageType === 'catalog') {
            const form = getCatalogForm();
            if (!form) return false;
            const header = form.querySelector('[data-glpi-form-renderer-form-header]');
            if (header) header.appendChild(bar);
            else form.insertBefore(bar, form.firstChild);
            return true;
        }
        const form = getTicketForm();
        if (!form || !form.parentNode) return false;
        form.parentNode.insertBefore(bar, form);
        return true;
    }

    function createHelpButton(lang) {
        if (document.querySelector('.tw-guide-bar')) return;

        const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
        const bar = document.createElement('div');
        bar.className = 'tw-guide-bar';
        bar.innerHTML =
            '<span class="tw-guide-hint"></span>' +
            '<button type="button" class="btn btn-sm btn-primary tw-guide-button">' + GUIDE_ICON + '<span></span></button>';
        bar.querySelector('.tw-guide-hint').textContent = tr(t, 'guideHint');
        const btn = bar.querySelector('.tw-guide-button');
        btn.querySelector('span').textContent = tr(t, 'guideButton');
        btn.setAttribute('title', tr(t, 'ariaHelpButton'));

        if (!placeGuideBar(bar)) return;

        btn.addEventListener('click', () => {
            const l = getLanguage();
            tourSteps = buildTourSteps(l);
            if (tourSteps.length > 0) startTour(l);
        });
    }

    /* ------------------------------------------------------------------ */
    /*  WELCOME POPUP                                                       */
    /* ------------------------------------------------------------------ */
    function createWelcomePopup(lang) {
        if (document.querySelector('.tw-welcome-popup')) return;

        const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

        welcomePopup = document.createElement('div');
        welcomePopup.className = 'tw-welcome-popup';
        welcomePopup.setAttribute('role', 'dialog');
        welcomePopup.setAttribute('aria-label', t.welcomeTitle);

        welcomePopup.innerHTML = `
            <div class="tw-welcome-header">
                <div class="tw-welcome-title-row">
                    <span class="tw-welcome-icon" aria-hidden="true">✨</span>
                    <h2 class="tw-welcome-title">${t.welcomeTitle}</h2>
                </div>
                <button type="button" class="tw-welcome-close" aria-label="${t.btnClose}">&times;</button>
            </div>
            <p class="tw-welcome-desc">${t.welcomeDesc}</p>
            <div class="tw-welcome-actions">
                <button type="button" class="tw-welcome-btn-start">${t.btnStart}</button>
                <button type="button" class="tw-welcome-btn-close">${t.btnClose}</button>
            </div>
            <label class="tw-welcome-hide">
                <input type="checkbox" class="tw-welcome-hide-input">
                <span>${tr(t, 'welcomeHide')}</span>
            </label>
        `;

        document.body.appendChild(welcomePopup);

        setTimeout(() => { if (welcomePopup) welcomePopup.classList.add('tw-show'); }, 80);

        const rememberChoice = () => {
            const box = welcomePopup && welcomePopup.querySelector('.tw-welcome-hide-input');
            if (box && box.checked) hideWelcomeForGood();
        };

        welcomePopup.querySelector('.tw-welcome-btn-start').addEventListener('click', () => {
            rememberChoice();
            const popup = welcomePopup;
            popup.classList.remove('tw-show');
            welcomePopup = null;
            setTimeout(() => {
                if (popup && popup.parentNode) popup.remove();
                // The form may have changed while the popup was open
                const l = getLanguage();
                tourSteps = buildTourSteps(l);
                if (tourSteps.length > 0) startTour(l);
            }, 430);
        });

        const dismiss = () => {
            rememberChoice();
            const popup = welcomePopup;
            if (!popup) return;
            popup.classList.remove('tw-show');
            welcomePopup = null;
            resetTourState();
            setTimeout(() => { if (popup && popup.parentNode) popup.remove(); }, 430);
        };

        welcomePopup.querySelector('.tw-welcome-close').addEventListener('click', dismiss);
        welcomePopup.querySelector('.tw-welcome-btn-close').addEventListener('click', dismiss);
    }

    /**
     * Fetch the admin settings once per page (and per service catalog form).
     *
     * The result is memoised: the detection loop re-enters initialisation
     * whenever the user moves between forms, and the settings cannot change
     * mid-page. On failure we fall back to "everything visible" rather than
     * leaving the wizard unusable — and we cache that fallback too, so a broken
     * endpoint cannot produce a request every 800 ms for the life of the page.
     */
    let configPromise = null;
    let configFormId  = null;

    function loadConfig() {
        const formIdInput = pageType === 'catalog'
            ? document.querySelector('form#forms_form_answers input[name="forms_id"]')
            : null;
        const formId = formIdInput ? formIdInput.value : '';
        if (configPromise && configFormId === formId) return configPromise;
        configFormId = formId;

        // For a service catalog form, also ask which ticket field each question
        // fills. The server checks the user may open the form, and some form
        // access rules look at the page's URL parameters, so pass them along.
        const params = new URLSearchParams(formId ? location.search : '');
        if (formId) params.set('forms_id', formId);
        const query = params.toString();

        configPromise = fetch(PLUGIN_URL + '/ajax/config.php' + (query ? '?' + query : ''), { credentials: 'same-origin' })
            .then(res => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(data => ({
                steps: Object.assign({}, DEFAULT_CONFIG, (data && data.steps) || {}),
                questions: (data && data.questions) || {}
            }))
            .catch(err => {
                console.error('[ticketwizard] Failed to load configuration, showing all steps:', err);
                return { steps: Object.assign({}, DEFAULT_CONFIG), questions: {} };
            });

        return configPromise;
    }

    // Guards against overlapping initialisation. The detection loop ticks every
    // 800 ms while `isInitialized` is false, but that flag is only set once the
    // config request resolves — so a slow response would otherwise start a
    // second (and third...) initialisation on top of the first.
    let initInFlight = false;

    function initializeWizard() {
        if (initInFlight || isInitialized) return;
        initInFlight = true;

        const lang = getLanguage();
        const type = pageType;

        loadConfig()
            .then(config => {
                // The page may have changed while the request was pending.
                if (getPageType() !== type) return;

                wizardConfig = config;

                // Watch the rich-text editor so required validation sees live input.
                setupTinyMceWatchers();

                tourSteps = buildTourSteps(lang);

                if (tourSteps.length === 0) {
                    return;
                }

                isInitialized = true;

                // The tour position is persisted in sessionStorage and resumes
                // after the reloads GLPI performs when the user changes Type or
                // Category, on the exact same step. It is cleared on explicit
                // actions: closing/finishing the guide, submitting the ticket,
                // or following a link to another page.
                const wasActive = storageGet('tw_active') === 'true' &&
                                  storageGet('tw_page') === location.pathname;
                if (wasActive) {
                    const savedKey = storageGet('tw_step_key');
                    let index = tourSteps.findIndex(s => s.key === savedKey);
                    if (index === -1) {
                        index = Math.min(parseInt(storageGet('tw_step') || '0', 10) || 0, tourSteps.length - 1);
                    }
                    createHelpButton(lang);
                    startTour(lang, index);
                } else {
                    resetTourState();
                    if (!isWelcomeHidden()) createWelcomePopup(lang);
                    createHelpButton(lang);
                }
            })
            .finally(() => {
                initInFlight = false;
            });
    }

    /* ------------------------------------------------------------------ */
    /*  DROPDOWN FOCUS TRACKING                                             */
    /* ------------------------------------------------------------------ */
    function setupDropdownListeners() {
        // 1. Native dropdowns and inputs (Focus / Blur)
        document.addEventListener('focusin', function(e) {
            const tag = e.target.tagName;
            const classes = e.target.className || '';
            if (
                tag === 'SELECT' ||
                (typeof classes === 'string' && (
                    classes.indexOf('select2-search__field') !== -1 ||
                    classes.indexOf('select2-selection') !== -1
                ))
            ) {
                if (wizardPopup) {
                    wizardPopup.classList.add('tw-dropdown-hidden');
                }
            }
        }, true);

        document.addEventListener('focusout', function(e) {
            const tag = e.target.tagName;
            const classes = e.target.className || '';
            if (
                tag === 'SELECT' ||
                (typeof classes === 'string' && (
                    classes.indexOf('select2-search__field') !== -1 ||
                    classes.indexOf('select2-selection') !== -1
                ))
            ) {
                setTimeout(() => {
                    const activeEl = document.activeElement;
                    if (activeEl && (
                        activeEl.tagName === 'SELECT' ||
                        (activeEl.className && typeof activeEl.className === 'string' && activeEl.className.indexOf('select2-search__field') !== -1)
                    )) {
                        return;
                    }
                    if (wizardPopup) {
                        wizardPopup.classList.remove('tw-dropdown-hidden');
                        onReposition();
                    }
                }, 150);
            }
        }, true);

        // 2. Select2 specific events (jQuery delegation)
        if (typeof jQuery !== 'undefined') {
            jQuery(document).on('select2:open', function() {
                if (wizardPopup) {
                    wizardPopup.classList.add('tw-dropdown-hidden');
                }
            });
            jQuery(document).on('select2:close select2:select', function() {
                setTimeout(() => {
                    if (wizardPopup) {
                        wizardPopup.classList.remove('tw-dropdown-hidden');
                        onReposition();
                    }
                }, 150);
            });
            // Update highlight colors dynamically on Select2 selection changes
            jQuery(document).on('select2:select select2:unselect select2:clear change', function() {
                setTimeout(updateHighlightColor, 50);
            });
        }
    }

    // A click on this link leaves the page (rather than opening a new tab,
    // running a script or jumping within the page).
    function isNavigationLink(link, e) {
        const href = (link.getAttribute('href') || '').trim();
        if (href === '' || href.charAt(0) === '#' || /^javascript:/i.test(href)) return false;
        if (link.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return false;
        return true;
    }

    function setupResetWatchers() {
        // CAPTURE-phase guard on the real "Add" button: while the guide is open,
        // block ticket creation if required fields are empty and mark them in red.
        // Only active when the wizard popup is showing, so a normal submit (guide
        // closed) is never blocked — GLPI still validates mandatory fields itself.
        document.addEventListener('click', function (e) {
            if (!wizardPopup) return;
            const addBtn = e.target.closest('[name="add"]');
            if (!addBtn) return;

            const missing = getMissingRequiredFields();
            if (missing.length > 0) {
                e.preventDefault();
                e.stopImmediatePropagation();   // stop GLPI's own submit handler + the reset handler below
                const l = getLanguage();
                markMissingRequired(missing);
                showRequiredWarning(l);
                const firstProxy = getVisibleElement(missing[0]) || missing[0];
                if (firstProxy && firstProxy.scrollIntoView) {
                    firstProxy.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }, true);

        document.addEventListener('click', function (e) {
            const target = e.target.closest('a, button, input');
            if (!target) return;

            // Submitting the ticket ends the guide (the page then reloads).
            if (target.name === 'add') {
                resetTourState();
                if (wizardPopup) closeGuide();
                return;
            }

            // So does following a link to another page: the guide must not
            // resume the next time a ticket form opens. If the link doesn't
            // leave after all, the guide stays and saves its place again on
            // the next step.
            if (target.tagName === 'A' && isNavigationLink(target, e)) {
                resetTourState();
            }
        });

        // Trigger dynamic color check on text inputs and textarea changes,
        // and keep the required-field red rings in sync on the final step.
        document.addEventListener('input', updateHighlightColor, true);
        document.addEventListener('change', updateHighlightColor, true);
        document.addEventListener('input', refreshRequiredMarks, true);
        document.addEventListener('change', refreshRequiredMarks, true);
    }

    /* ------------------------------------------------------------------ */
    /*  TICKET CREATION PAGE DETECTOR                                       */
    /*  Only the "create new ticket" form should trigger the wizard —      */
    /*  not other creation forms (computers, users, Problems, Changes...). */
    /* ------------------------------------------------------------------ */
    function getTicketForm() {
        // The main ITIL form is rendered with id="itil-form" (Ticket/Problem/Change).
        const form = document.querySelector('form#itil-form');
        if (form) return form;
        const addBtn = document.querySelector('[name="add"]');
        return addBtn ? addBtn.closest('form') : null;
    }

    function isTicketCreationForm() {
        const form = getTicketForm();
        if (!form) return false;

        // Must be in CREATION mode: an "add" submit button (edit forms use "update").
        if (!form.querySelector('[name="add"]')) return false;

        // Must be a Ticket specifically — the form posts to ticket.form.php, or
        // to tracking.injector.php in GLPI 10's simplified interface.
        const action = (form.getAttribute('action') || form.action || '').toLowerCase();
        if (action.indexOf('ticket.form.php') !== -1) return true;
        if (action.indexOf('tracking.injector.php') !== -1) return true;

        // Fallback: the "type" field (Incident / Request) exists only on Tickets,
        // never on Problem or Change forms.
        if (form.querySelector('select[name="type"]')) return true;

        return false;
    }

    function getCatalogForm() {
        return document.querySelector('form#forms_form_answers');
    }

    // GLPI 11's simplified interface creates tickets through service catalog
    // forms (/Form/Render/<id>), not the ticket form.
    function isServiceCatalogForm() {
        const form = getCatalogForm();
        if (!form) return false;

        // Once sent, GLPI replaces the questions with a confirmation.
        const done = form.querySelector('[data-glpi-form-renderer-success]');
        if (done && !done.classList.contains('d-none')) return false;

        return form.querySelector('[data-glpi-form-renderer-question]') !== null;
    }

    // 'ticket' for a ticket form, 'catalog' for a GLPI 11 service catalog
    // form, null elsewhere.
    function getPageType() {
        if (isServiceCatalogForm()) return 'catalog';
        if (isTicketCreationForm()) return 'ticket';
        return null;
    }

    /* ------------------------------------------------------------------ */
    /*  DETECTION LOOP                                                      */
    /* ------------------------------------------------------------------ */
    function run() {
        if (intervalId !== null) return;

        setupDropdownListeners();
        setupResetWatchers();

        // Note: the tour state is deliberately NOT reset on page load. It is
        // cleared only on explicit actions (closing the guide, submitting, or
        // navigating away) so that the GLPI form reloads triggered by changing
        // Type or Category resume the user on the same step.

        intervalId = setInterval(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                cleanup();
                isInitialized = false;
            }

            const type = getPageType();

            if (type !== pageType) {
                // Left the form, or went to another kind of form
                if (isInitialized) {
                    cleanup();
                    isInitialized = false;
                }
                pageType = type;
            }

            if (type) {
                if (!isInitialized) {
                    initializeWizard();
                    return;
                }
                // GLPI re-rendered the form and took the guide bar with it.
                if (!document.querySelector('.tw-guide-bar')) {
                    createHelpButton(getLanguage());
                }
                if (wizardPopup && tourSteps[currentStep] && !isVisible(tourSteps[currentStep].element)) {
                    resyncSteps();
                }
            }
        }, 800);
    }

    /* ------------------------------------------------------------------ */
    /*  ENTRY POINT                                                         */
    /* ------------------------------------------------------------------ */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }

})();
