'use client'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreateGuestBody, CreateGuestBodyType } from '@/schemaValidations/account.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { useCreateGuestMutation } from '@/queries/useAccount'
import { toast } from '@/components/ui/use-toast'
import { handleErrorApi } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

export default function AddGuest() {
  const [open, setOpen] = useState(false)
  const createGuestMutation = useCreateGuestMutation()
  const queryClient = useQueryClient()

  const form = useForm<CreateGuestBodyType>({
    resolver: zodResolver(CreateGuestBody) as any,
    defaultValues: {
      name: '',
      tableNumber: 0
    }
  })

  const reset = () => {
    form.reset()
  }

  const onSubmit = async (values: CreateGuestBodyType) => {
    if (createGuestMutation.isPending) return
    try {
      const result = await createGuestMutation.mutateAsync(values)
      toast({ description: result.payload.message })
      reset()
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.guests.all })
    } catch (error) {
      handleErrorApi({ error, setError: form.setError })
    }
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size='sm' className='h-7 gap-1'>
          <PlusCircle className='h-3.5 w-3.5' />
          <span className='sr-only sm:not-sr-only sm:whitespace-nowrap'>Thêm khách</span>
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[400px] max-h-screen overflow-auto'>
        <DialogHeader>
          <DialogTitle>Thêm khách hàng</DialogTitle>
          <DialogDescription>Nhập tên và số bàn cho khách</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form noValidate className='grid auto-rows-max items-start gap-4 md:gap-8'
            id='add-guest-form' onSubmit={form.handleSubmit(onSubmit)} onReset={reset}>
            <div className='grid gap-4 py-4'>
              <FormField control={form.control} name='name'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='name'>Tên</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Input id='name' className='w-full' {...field} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )} />
              <FormField control={form.control} name='tableNumber'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='tableNumber'>Số bàn</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Input id='tableNumber' className='w-full' type='number'
                          {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )} />
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='add-guest-form'>Thêm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

