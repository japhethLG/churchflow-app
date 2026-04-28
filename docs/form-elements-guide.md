# Form Elements Setup Guide

A guide for replicating Pegasus's form-element architecture in other projects. The goal is a single, consistent way to build forms across the app: typed, validated, accessible, and ergonomic at the call site.

---

## 1. Libraries

| Library | Role |
|---|---|
| [`react-hook-form`](https://react-hook-form.com) | Source of truth for form state, validation triggers, submission. |
| [`zod`](https://zod.dev) | Schema definition + static type inference for the form shape. |
| [`@hookform/resolvers/zod`](https://github.com/react-hook-form/resolvers) | Bridges Zod schemas into RHF's `resolver` API. |
| [`antd`](https://ant.design) | Underlying UI primitives (Input, Select, Checkbox, DatePicker, Switch, Form.Item, etc.). |
| [`react-number-format`](https://s-yadav.github.io/react-number-format/docs/intro) | Numeric/currency masking inside `InputNumber`. |
| [`dayjs`](https://day.js.org) | Date/time values for date- and time-pickers. |
| [`clsx`](https://github.com/lukeed/clsx) + [`tailwind-merge`](https://github.com/dcastil/tailwind-merge) | `cn()` helper for class composition. |
| [`class-variance-authority`](https://cva.style) | Variant tokens (sizes/styles) on the low-level primitives. |
| `tailwindcss` | Styling. |

Install (minimum set):

```bash
npm i react-hook-form zod @hookform/resolvers antd react-number-format dayjs clsx tailwind-merge class-variance-authority
```

---

## 2. The architecture in one picture

```
┌─────────────────────────────────────────────────────────────┐
│  Page / Modal                                               │
│    useForm({ resolver: zodResolver(schema), defaultValues })│
│    <Form methods={methods} onSubmit={onSubmit}>             │
│      <FormInput inputName="..." />        ← Form-aware      │
│      <FormSelect inputName="..." />          wrapper        │
│      <FormSubmit>Save</FormSubmit>                          │
│    </Form>                                                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  components/formElements/Form*                              │
│    - Reads control + errors from useFormContext()           │
│    - Wraps a Controller around the primitive                │
│    - Renders <FormItem> + <FormLabel> + <FormHelpText>      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  components/common/* (presentational primitives)            │
│    - Antd's Input / Select / Checkbox etc., styled,         │
│      sized via cva, error-aware                             │
└─────────────────────────────────────────────────────────────┘
```

Three rules make this work:

1. **Form state lives in RHF, not local state.** Every `Form*` wrapper reads it via `useFormContext()`.
2. **Wrappers always use `<Controller>`.** Antd inputs are not RHF-native; `Controller` adapts them.
3. **Layout/label/error rendering is centralized.** Every wrapper composes `FormItem` + `FormLabel` + `FormHelpText` so error and label styling never drifts.

---

## 3. The core building blocks

These are project-wide; build them once and reuse for every field.

### 3.1 `cn` helper — [src/utils/helpers.ts:11](../src/utils/helpers.ts#L11)

```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs))
}
```

### 3.2 `<Form>` — [src/components/formElements/Form/index.tsx](../src/components/formElements/Form/index.tsx)

A thin wrapper around `<FormProvider>` so child wrappers can use `useFormContext()`:

```tsx
import { FormProvider, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { cn } from 'utils/helpers'

interface IProps<T extends FieldValues> {
    children: React.ReactNode
    methods: UseFormReturn<T, any, any>
    onSubmit: (values: T) => void
    className?: string
}

export const Form = <T extends FieldValues>({ children, methods, onSubmit, className }: IProps<T>) => (
    <FormProvider {...methods}>
        <form className={cn('w-full', className)} onSubmit={methods.handleSubmit(onSubmit)}>
            {children}
        </form>
    </FormProvider>
)
```

### 3.3 `<FormItem>` — [src/components/formElements/FormItem/index.tsx](../src/components/formElements/FormItem/index.tsx)

A defaults-applied `Form.Item` so margin, error states, and help-text rendering are consistent:

```tsx
import { Form, type FormItemProps } from 'antd'
import { cn } from 'utils/helpers'

interface IProps extends FormItemProps {
    children: React.ReactNode
    validateStatus?: 'error' | 'warning' | 'success' | ''
    help?: React.ReactNode
    className?: string
}

export const FormItem = ({ children, validateStatus, help, className, ...rest }: IProps) => (
    <Form.Item className={cn('mb-0', className)} validateStatus={validateStatus} help={help} {...rest}>
        {children}
    </Form.Item>
)
```

### 3.4 `<FormLabel>` — [src/components/formElements/FormLabel/index.tsx](../src/components/formElements/FormLabel/index.tsx)

Renders the label, required-asterisk, optional tooltip, optional description:

```tsx
export const FormLabel = ({ label, isRequired, tooltipLabel, description }: IProps) => (
    <div>
        <div className="flex items-center gap-1">
            <p className="flex gap-1 text-sm font-medium text-gray-11">
                {label}
                {isRequired && <span className="text-red-600">*</span>}
            </p>
            {tooltipLabel && (
                <Tooltip title={tooltipLabel} placement="top">
                    <Button variant="ghost"><InfoCircledIcon /></Button>
                </Tooltip>
            )}
        </div>
        {description && <FormExtraText message={description} />}
    </div>
)
```

### 3.5 `<FormHelpText>` — [src/components/formElements/FormHelpText/index.tsx](../src/components/formElements/FormHelpText/index.tsx)

The error message style:

```tsx
export const FormHelpText = ({ message }: { message: string }) =>
    <div className="mt-1 text-xs text-red-6">{message}</div>
```

### 3.6 `<FormSubmit>` — [src/components/formElements/FormSubmit/index.tsx](../src/components/formElements/FormSubmit/index.tsx)

Just a submit button that respects `isLoading`:

```tsx
export const FormSubmit = ({ children, isLoading, disabled, ...rest }: IProps) => (
    <Button type="submit" variant="primary" disabled={disabled || isLoading} {...rest}>
        {children}
    </Button>
)
```

---

## 4. The wrapper pattern (the recipe to reuse for any input)

Every field wrapper follows the same five-step shape. If you remember this, you can build a wrapper for anything (Input, Select, DatePicker, ColorPicker, custom widget, etc.).

```tsx
// components/formElements/FormX/index.tsx
import { Controller, get, useFormContext } from 'react-hook-form'

import { X as XPrimitive } from 'components/common'         // 1. presentational primitive

import { FormHelpText } from '../FormHelpText'
import { FormItem } from '../FormItem'
import { FormLabel } from '../FormLabel'

interface IProps /* extends primitive props */ {
    inputName: string                                        // 2. field name in RHF
    label?: string
    isRequired?: boolean
    description?: string
    tooltipLabel?: string
    layout?: 'vertical' | 'horizontal'
    className?: string
}

export const FormX = ({ inputName, label, isRequired, description, tooltipLabel, layout = 'vertical', className, ...rest }: IProps) => {
    const { control, formState: { errors } } = useFormContext()                  // 3. read context
    const fieldError = get(errors, inputName)                                    // supports nested names like "address.line1"

    return (
        <Controller
            control={control}
            name={inputName}
            render={({ field }) => (                                             // 4. wrap the primitive in Controller
                <FormItem                                                        // 5. render FormItem + label + help
                    label={label && <FormLabel label={label} isRequired={isRequired} description={description} tooltipLabel={tooltipLabel} />}
                    validateStatus={fieldError ? 'error' : ''}
                    help={fieldError?.message ? <FormHelpText message={fieldError.message as string} /> : null}
                    className={className}
                    layout={layout}
                >
                    <XPrimitive {...rest} {...field} hasError={!!fieldError} />
                </FormItem>
            )}
        />
    )
}
```

Why `get(errors, inputName)` instead of `errors[inputName]`? It walks dotted paths so `inputName="address.line1"` works without extra code.

### 4.1 Field-types that need `field` adaptation

Some Antd inputs don't speak RHF's `(value, onChange)` shape directly. The Controller still gives you `field`, but you have to translate:

| Field | Translation |
|---|---|
| `Checkbox` | `checked={field.value} onChange={e => field.onChange(e.target.checked)}` |
| `Switch` | `checked={field.value}` (Antd Switch's `onChange` already passes a boolean) |
| `react-number-format` | `value={value ?? ''} onValueChange={v => onChange(v.floatValue ?? '')}` |
| `Upload` (`Dragger`) | Hijack `beforeUpload`, store the file via `field.onChange(file)` and return `false`. |
| `DatePicker` | Pass a `Dayjs` value and translate to your stored format on change. |

These are the only special cases — everything else is the boilerplate above.

---

## 5. Recipes for the common components

### 5.1 Text input — `<FormInput>`

Wraps a styled Antd `Input` ([components/common/Input](../src/components/common/Input/index.tsx)). Reference: [FormInput/index.tsx](../src/components/formElements/FormInput/index.tsx).

```tsx
<FormInput inputName="email" label="Email" isRequired placeholder="you@example.com" />
```

### 5.2 Number — `<FormInputNumber>`

Backed by [`react-number-format`](https://s-yadav.github.io/react-number-format/) so you get thousands-separators, decimal control, prefix/suffix, etc. Reference: [FormInputNumber/index.tsx](../src/components/formElements/FormInputNumber/index.tsx).

```tsx
<FormInputNumber inputName="duration" label="Duration" suffix="mins" isRequired />
```

The Controller adapts `onValueChange` → `onChange(values.floatValue)` so RHF stores a number, not the formatted string.

### 5.3 Currency — `<FormCurrencyInput>`

Same primitive as `FormInputNumber`, but the prefix is a localized currency symbol via a `useBillingCurrency()` hook. Reference: [FormCurrencyInput/index.tsx](../src/components/formElements/FormCurrencyInput/index.tsx).

```tsx
<FormCurrencyInput inputName="deposit" label="Deposit" />
```

For other projects, drop the billing-context lookup if you don't need it — the rest is mechanical.

### 5.4 Textarea — `<FormTextArea>`

Reference: [FormTextArea/index.tsx](../src/components/formElements/FormTextArea/index.tsx).

```tsx
<FormTextArea inputName="notes" label="Notes" rows={4} autoSize={{ minRows: 2, maxRows: 8 }} />
```

### 5.5 Select — `<FormSelect>`

Wraps a styled Antd `Select`. Accepts `options: { label, value }[]` and `mode="multiple"` for tag-style multi-select. Reference: [FormSelect/index.tsx](../src/components/formElements/FormSelect/index.tsx).

```tsx
<FormSelect
    inputName="assignedPractitioners"
    label="Assigned staff"
    mode="multiple"
    options={staffOptions}
/>
```

For paginated/searchable selects, the wrapper exposes `onPopupScroll`, `onSearch`, `loading` — see how `FormPatientsDropdown`/`FormUsersDropdown` build on top of `FormSelect`.

### 5.6 Checkbox — `<FormCheckbox>`

Reference: [FormCheckbox/index.tsx](../src/components/formElements/FormCheckbox/index.tsx). The label goes in the children:

```tsx
<FormCheckbox inputName="isActive">Active appointment</FormCheckbox>
```

Note the `e.target.checked` translation in the Controller — this is the shape difference between Antd's Checkbox and RHF.

### 5.7 Switch — `<FormSwitch>`

Reference: [FormSwitch/index.tsx](../src/components/formElements/FormSwitch/index.tsx).

```tsx
<FormSwitch inputName="emailNotifications" label="Email notifications" />
```

### 5.8 Radio group — `<FormRadio>`

Reference: [FormRadio/index.tsx](../src/components/formElements/FormRadio/index.tsx). Children are `<Radio>` instances, not options:

```tsx
<FormRadio inputName="gender" label="Gender">
    <Radio value="male">Male</Radio>
    <Radio value="female">Female</Radio>
</FormRadio>
```

### 5.9 Date picker — `<FormDatePicker>`

Reference: [FormDatePicker/index.tsx](../src/components/formElements/FormDatePicker/index.tsx). Uses `dayjs` values internally; serialize to ISO when sending to the API.

```tsx
<FormDatePicker inputName="dateOfBirth" label="DOB" variant="long" />
```

### 5.10 Time picker — `<FormTimePicker>`

Reference: [FormTimePicker/index.tsx](../src/components/formElements/FormTimePicker/index.tsx).

### 5.11 File upload — `<FormUpload>`

Reference: [FormUpload/index.tsx](../src/components/formElements/FormUpload/index.tsx). Uses Antd's `Dragger`. Note the `beforeUpload` returning `false` — that's how you keep the file local instead of auto-uploading; the actual upload happens at submit time.

### 5.12 Submit — `<FormSubmit>`

```tsx
<FormSubmit isLoading={isCreating}>Save</FormSubmit>
```

Disabled while loading, type="submit", uses your design-system Button.

---

## 6. End-to-end example

This is the same shape used in [AddAppointmentTypeModal](../src/components/modals/components/AddAppointmentTypeModal/index.tsx).

### 6.1 The schema — `formHelpers.ts`

```ts
import * as z from 'zod'

export const validationSchema = z.object({
    name: z.string().min(1, 'Appointment type is required'),
    duration: z.number().min(1, 'Duration is required'),
    deposit: z.number().positive('Deposit must be positive').nullable().optional(),
    assignedPractitioners: z.array(z.string()).optional(),
    isActiveAppointment: z.boolean().optional(),
})

export type TFormSchema = z.infer<typeof validationSchema>

export const defaultValues: TFormSchema = {
    name: '',
    duration: 0,
    deposit: undefined,
    assignedPractitioners: [],
    isActiveAppointment: true,
}
```

Two things to copy: (a) inferring the form type from the schema removes the duplicate-types problem; (b) `defaultValues` must satisfy the same type — RHF will yell otherwise.

### 6.2 The component

```tsx
const AppointmentTypeModal = ({ closeModal, modalData }: IProps) => {
    const methods = useForm<TFormSchema>({
        defaultValues: modalData?.values ?? defaultValues,
        resolver: zodResolver(validationSchema),
        mode: 'onBlur',                    // validate on blur, re-validate on change
    })

    const onSubmit = async (values: TFormSchema) => {
        // hit your API
    }

    return (
        <Form methods={methods} onSubmit={onSubmit}>
            <FormInput inputName="name" label="Appointment type" isRequired />
            <FormInputNumber inputName="duration" label="Duration" suffix="mins" isRequired />
            <FormCurrencyInput inputName="deposit" label="Deposit" />
            <FormSelect inputName="assignedPractitioners" label="Staff" mode="multiple" options={staffOptions} isRequired />
            <FormCheckbox inputName="isActiveAppointment">Active appointment</FormCheckbox>

            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={closeModal}>Cancel</Button>
                <FormSubmit isLoading={isSubmitting}>Save</FormSubmit>
            </div>
        </Form>
    )
}
```

That's the whole pattern. Note what's *not* there: no manual `value`, no `onChange`, no manual error rendering. The wrappers do all of that.

---

## 7. Validation conventions

- **One Zod schema per form.** Keep it next to the component in `formHelpers.ts`.
- **Always `z.infer<typeof schema>` for the form type.** Don't hand-write a `TFormValues` interface that duplicates the schema — they'll drift.
- **Use `mode: 'onBlur'`** by default. It runs validation when the user finishes interacting with a field, not on every keystroke (less noise).
- **Optional vs nullable.** Antd selects emit `undefined` when cleared; numbers may be `null` in the DB. Pick one and be consistent: e.g., `z.number().nullable().optional()` if the API can store either.
- **API → form coercion lives at the call site,** not inside wrappers. If the API returns `null`, map it to a sensible default in `defaultValues` (see how `AppointmentTypeModal` handles `values.deposit ?? undefined`).
- **Error messages are user-facing strings** — write them as such in the schema. `FormHelpText` will render them verbatim.

---

## 8. Setup checklist for a new project

1. Install the dependencies in §1.
2. Configure `tailwindcss` and Antd's stylesheet (Antd v5+ no longer needs a global CSS import; v6 either way is fine).
3. Add `cn()` from §3.1 to `utils/`.
4. Create `components/common/` with at least: `Button`, `Input`, `InputNumber`, `Select`, `Checkbox`, `Switch`, `DatePicker`, `TimePicker`, `TextArea`. Each one is a thin styling layer over the Antd primitive — see [Input](../src/components/common/Input/index.tsx) and [Select](../src/components/common/Select/index.tsx) for the canonical examples (use `cva` for size variants, accept a `hasError` prop for red border).
5. Create `components/formElements/` with the core blocks from §3 (`Form`, `FormItem`, `FormLabel`, `FormHelpText`, `FormSubmit`).
6. Add wrappers as you need them, following §4.
7. Re-export everything from `components/formElements/index.tsx` so call sites can do `import { Form, FormInput, FormSelect } from 'components/formElements'`.

---

## 9. Things to avoid (learned the hard way)

- **Don't create a wrapper that takes `value`/`onChange` from props.** It tempts callers to manage their own state; that defeats the whole pattern. Wrappers should always read RHF context — the only field-identifying prop is `inputName`.
- **Don't render labels inside the primitive.** Keep them in `<FormLabel>` so layout, required-asterisk, tooltip, and description are consistent.
- **Don't render errors anywhere except `FormHelpText`.** If you need a different error style, change `FormHelpText`, not the call site.
- **Don't reach into `errors[inputName]` directly** for nested fields — use `get(errors, inputName)`.
- **Don't `useState` the form's data.** Anything you'd be tempted to put in local state is either a derived value (`watch()`) or another form field.

---

