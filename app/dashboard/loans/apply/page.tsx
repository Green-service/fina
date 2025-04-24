"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { calculateMonthlyPayment } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const loanTypes = [
  {
    id: "personal",
    name: "Personal Loan",
    description: "For personal expenses, debt consolidation, or major purchases",
    interestRate: 12.5,
    minAmount: 5000,
    maxAmount: 100000,
    minTerm: 6,
    maxTerm: 60,
  },
  {
    id: "student",
    name: "Student Loan",
    description: "For education expenses, tuition, books, and living costs",
    interestRate: 8.5,
    minAmount: 10000,
    maxAmount: 200000,
    minTerm: 12,
    maxTerm: 84,
  },
  {
    id: "business",
    name: "Business Loan",
    description: "For business expansion, equipment, or working capital",
    interestRate: 15.0,
    minAmount: 20000,
    maxAmount: 500000,
    minTerm: 12,
    maxTerm: 60,
  },
]

const loanSchema = z.object({
  loanType: z.string({
    required_error: "Please select a loan type",
  }),
  amount: z.coerce
    .number({
      required_error: "Please enter a loan amount",
      invalid_type_error: "Please enter a valid number",
    })
    .min(5000, {
      message: "Loan amount must be at least R5,000",
    })
    .max(500000, {
      message: "Loan amount cannot exceed R500,000",
    }),
  term: z.coerce
    .number({
      required_error: "Please enter a loan term",
      invalid_type_error: "Please enter a valid number",
    })
    .min(6, {
      message: "Loan term must be at least 6 months",
    })
    .max(84, {
      message: "Loan term cannot exceed 84 months",
    }),
  purpose: z.string().min(10, {
    message: "Purpose must be at least 10 characters",
  }),
  bankStatement: z.any().refine((files) => {
    if (typeof window === 'undefined') return true; // Skip validation during SSR
    return files instanceof FileList && files.length > 0;
  }, {
    message: "Bank statement is required",
  }),
  idDocument: z.any().refine((files) => {
    if (typeof window === 'undefined') return true; // Skip validation during SSR
    return files instanceof FileList && files.length > 0;
  }, {
    message: "ID document is required",
  }),
})

export default function LoanApplicationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [selectedLoanType, setSelectedLoanType] = useState(loanTypes[0])
  const supabase = createClient()

  const form = useForm<z.infer<typeof loanSchema>>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      loanType: "",
      amount: undefined,
      term: undefined,
      purpose: "",
    },
  })

  const watchLoanType = form.watch("loanType")
  const watchAmount = form.watch("amount")
  const watchTerm = form.watch("term")

  // Update selected loan type when form value changes
  useState(() => {
    if (watchLoanType) {
      const selected = loanTypes.find((type) => type.id === watchLoanType)
      if (selected) {
        setSelectedLoanType(selected)
      }
    }
  })

  // Calculate monthly payment
  const monthlyPayment =
    watchAmount && watchTerm ? calculateMonthlyPayment(watchAmount, selectedLoanType.interestRate, watchTerm) : null

  async function onSubmit(values: z.infer<typeof loanSchema>) {
    setIsSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Upload bank statement
      const bankStatementFile = values.bankStatement[0]
      const bankStatementExt = bankStatementFile.name.split(".").pop()
      const bankStatementPath = `${user.id}/bank-statements/${Date.now()}.${bankStatementExt}`

      const { error: bankStatementError } = await supabase.storage
        .from("loan-documents")
        .upload(bankStatementPath, bankStatementFile)

      if (bankStatementError) throw bankStatementError

      // Upload ID document
      const idDocumentFile = values.idDocument[0]
      const idDocumentExt = idDocumentFile.name.split(".").pop()
      const idDocumentPath = `${user.id}/id-documents/${Date.now()}.${idDocumentExt}`

      const { error: idDocumentError } = await supabase.storage
        .from("loan-documents")
        .upload(idDocumentPath, idDocumentFile)

      if (idDocumentError) throw idDocumentError

      // Get public URLs for the uploaded files
      const { data: bankStatementUrl } = supabase.storage.from("loan-documents").getPublicUrl(bankStatementPath)
      const { data: idDocumentUrl } = supabase.storage.from("loan-documents").getPublicUrl(idDocumentPath)

      // Get loan type ID
      const { data: loanTypeData } = await supabase
        .from("loan_types")
        .select("id")
        .eq("name", selectedLoanType.name)
        .single()

      // Create loan application
      const { error: loanError } = await supabase.from("loan_applications").insert({
        user_id: user.id,
        loan_type_id: loanTypeData?.id,
        amount: values.amount,
        term: values.term,
        purpose: values.purpose,
        monthly_payment: monthlyPayment,
        bank_statement_url: bankStatementUrl.publicUrl,
        id_document_url: idDocumentUrl.publicUrl,
        status: "pending",
      })

      if (loanError) throw loanError

      // Show success dialog after 5 seconds
      setTimeout(() => {
        setShowSuccessDialog(true)
      }, 5000)

      router.push("/dashboard/loans")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
    <DashboardShell>
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Apply for a Loan</h1>
            <p className="text-muted-foreground">Fill out the form below to apply for a loan</p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Loan Application Form</CardTitle>
                <CardDescription>Please provide accurate information to expedite your application</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="loanType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Type</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value)
                              const selected = loanTypes.find((type) => type.id === value)
                              if (selected) {
                                setSelectedLoanType(selected)
                              }
                            }}
                          >
                            <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                              <SelectValue placeholder="Select loan type" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-white/10">
                              <SelectItem value="personal" className="text-white hover:bg-white/10">Personal Loan</SelectItem>
                              <SelectItem value="business" className="text-white hover:bg-white/10">Business Loan</SelectItem>
                              <SelectItem value="education" className="text-white hover:bg-white/10">Education Loan</SelectItem>
                              <SelectItem value="home" className="text-white hover:bg-white/10">Home Loan</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>{selectedLoanType?.description}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loan Amount (ZAR)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter amount"
                                {...field}
                                min={selectedLoanType.minAmount}
                                max={selectedLoanType.maxAmount}
                              />
                            </FormControl>
                            <FormDescription>
                              Min: R{selectedLoanType.minAmount.toLocaleString()}, Max: R
                              {selectedLoanType.maxAmount.toLocaleString()}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="term"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loan Term (Months)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter term"
                                {...field}
                                min={selectedLoanType.minTerm}
                                max={selectedLoanType.maxTerm}
                              />
                            </FormControl>
                            <FormDescription>
                              Min: {selectedLoanType.minTerm} months, Max: {selectedLoanType.maxTerm} months
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Purpose</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe why you need this loan"
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Provide details about how you plan to use the loan</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="bankStatement"
                        render={({ field: { value, onChange, ...fieldProps } }) => (
                          <FormItem>
                            <FormLabel>Bank Statement (Last 3 Months)</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => onChange(e.target.files)}
                                  {...fieldProps}
                                  className="cursor-pointer"
                                />
                              </div>
                            </FormControl>
                            <FormDescription>Upload your bank statement (PDF or image)</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="idDocument"
                        render={({ field: { value, onChange, ...fieldProps } }) => (
                          <FormItem>
                            <FormLabel>ID Document</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => onChange(e.target.files)}
                                  {...fieldProps}
                                  className="cursor-pointer"
                                />
                              </div>
                            </FormControl>
                            <FormDescription>Upload your ID document (PDF or image)</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting Application..." : "Submit Application"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Loan Summary</CardTitle>
                <CardDescription>Review your loan details before submitting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">Loan Type</h3>
                  <p className="text-muted-foreground">{watchLoanType ? selectedLoanType.name : "Not selected"}</p>
                </div>
                <div>
                  <h3 className="font-medium">Interest Rate</h3>
                  <p className="text-muted-foreground">{selectedLoanType.interestRate}% per annum</p>
                </div>
                <div>
                  <h3 className="font-medium">Loan Amount</h3>
                  <p className="text-muted-foreground">
                    {watchAmount ? `R${watchAmount.toLocaleString()}` : "Not specified"}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Loan Term</h3>
                  <p className="text-muted-foreground">{watchTerm ? `${watchTerm} months` : "Not specified"}</p>
                </div>
                <div>
                  <h3 className="font-medium">Monthly Payment</h3>
                  <p className="text-xl font-semibold text-primary">
                    {monthlyPayment ? `R${monthlyPayment.toFixed(2)}` : "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Total Repayment</h3>
                  <p className="text-muted-foreground">
                    {monthlyPayment && watchTerm ? `R${(monthlyPayment * watchTerm).toFixed(2)}` : "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Total Interest</h3>
                  <p className="text-muted-foreground">
                    {monthlyPayment && watchTerm && watchAmount
                      ? `R${(monthlyPayment * watchTerm - watchAmount).toFixed(2)}`
                      : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-500">Loan Application Submitted!</DialogTitle>
            <DialogDescription>
              Your loan application has been submitted successfully. Please check your loans page for approval status.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}
