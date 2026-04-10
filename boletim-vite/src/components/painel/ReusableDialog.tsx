import {
  Dialog,
  Portal,
  CloseButton,
} from "@chakra-ui/react";
import React from "react";

type ReusableDialogProps = {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
};

export function ReusableDialog({
  trigger,
  open,
  onOpenChange,
  title,
  children,
  footer,
  showCloseButton = true,
}: ReusableDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange?.(e.open)}
    >
      {trigger && (
        <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      )}

      <Portal>
        <Dialog.Backdrop />

        <Dialog.Positioner>
            <Dialog.Content
            maxW={{ base: "95%", md: "800px", lg: "1000px" }}
            w="full"
            >
            {title && (
              <Dialog.Header>
                <Dialog.Title>{title}</Dialog.Title>
              </Dialog.Header>
            )}

            <Dialog.Body>{children}</Dialog.Body>

            {footer && (
              <Dialog.Footer>{footer}</Dialog.Footer>
            )}

            {showCloseButton && (
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" position="absolute" top="2" right="2" />
              </Dialog.CloseTrigger>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
