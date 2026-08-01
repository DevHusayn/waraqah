import InvoiceLimitModal from '../InvoiceLimitModal';
import ShareDocumentModal from '../ShareDocumentModal';
import CustomUnitModal from '../CustomUnitModal';
import { getDisplayNumber } from '../../utils/receiptHelpers';

export default function DocumentFormModals({
    limitModalOpen,
    onCloseLimitModal,
    invoiceUsage,
    shareModal,
    docLabel,
    shareDocKey,
    sharePdfReady,
    emailSending,
    onShare,
    onEmailClient,
    onSkipShare,
    customUnitModalOpen,
    onCloseCustomUnitModal,
    onCustomUnitSave,
}) {
    return (
        <>
            <InvoiceLimitModal
                open={limitModalOpen}
                onClose={onCloseLimitModal}
                usage={invoiceUsage}
            />

            <ShareDocumentModal
                open={Boolean(shareModal)}
                docLabel={docLabel}
                docNumber={shareModal ? getDisplayNumber(shareModal[shareDocKey]) : ''}
                clientName={shareModal?.client?.name}
                clientEmail={shareModal?.client?.email}
                shareReady={sharePdfReady}
                emailSending={emailSending}
                clientAlreadyEmailed={Boolean(shareModal?.clientAlreadyEmailed)}
                onShare={onShare}
                onEmailClient={onEmailClient}
                onSkip={onSkipShare}
            />

            <CustomUnitModal
                open={customUnitModalOpen}
                onClose={onCloseCustomUnitModal}
                onSave={onCustomUnitSave}
            />
        </>
    );
}
