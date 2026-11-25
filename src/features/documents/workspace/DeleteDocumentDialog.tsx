"use client";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function DeleteDocumentDialog({ open, onOpenChange, title, onConfirm }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border text-foreground rounded-2xl shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-lg">Delete this document?</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-xs sm:text-sm">
            <span className="text-foreground font-medium">{title}</span> and everything generated from
            it — notes, flashcards, quiz and podcast — will be permanently removed. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="border-border bg-card text-foreground hover:bg-muted rounded-full text-xs">
            Keep it
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full text-xs"
          >
            Delete document
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
