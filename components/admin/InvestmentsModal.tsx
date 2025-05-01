import { InvestmentsTable } from "./InvestmentsTable"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface InvestmentsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function InvestmentsModal({ isOpen, onClose }: InvestmentsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] bg-[#1B1B2C] border-green-500/20 overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold text-white">Investments</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-green-500/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>
        <div className="mt-4">
          <InvestmentsTable />
        </div>
      </DialogContent>
    </Dialog>
  )
} 