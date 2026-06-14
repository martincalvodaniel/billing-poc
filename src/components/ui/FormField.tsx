interface FormFieldProps {
  id: string
  label: string
  required?: boolean
  children: React.ReactNode
}
export default function FormField({
  id,
  label,
  required,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </label>
      {children}
    </div>
  )
}
