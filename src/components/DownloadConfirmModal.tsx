import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Download, AlertTriangle } from 'lucide-react';

interface DownloadConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  photoTitle: string;
}

const DownloadConfirmModal = ({
  open,
  onOpenChange,
  onConfirm,
  photoTitle,
}: DownloadConfirmModalProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <AlertDialogTitle>Download Image</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <p>
              This image is owned by the creator. Downloads are for personal 
              inspiration and viewing only.
            </p>
            <p className="font-medium text-foreground">
              Commercial use, redistribution, or resale is not permitted without 
              creator consent.
            </p>
            <div className="p-3 rounded-lg bg-muted text-sm">
              <p className="font-medium mb-1">You are downloading:</p>
              <p className="text-muted-foreground truncate">{photoTitle}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DownloadConfirmModal;
