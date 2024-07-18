'use client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/components/ui/use-toast'
import { getVietnameseDishStatus, handleErrorApi } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UpdateDishBody, UpdateDishBodyType } from '@/schemaValidations/dish.schema'
import { DishStatus, DishStatusValues } from '@/constants/type'
import { Textarea } from '@/components/ui/textarea'
import { useUploadMediaMutation } from '@/queries/useMedia'
import { useGetDishQuery, useUpdateDishMutation } from '@/queries/useDish'
import revalidateApiRequest from '@/apiRequests/revalidate'

const EditDish = ({
  id,
  setId,
  onSubmitSuccess
}: {
  id?: number | undefined
  setId: (value: number | undefined) => void
  onSubmitSuccess?: () => void
}) => {
  const [file, setFile] = useState<File | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  // **  React Query
  const uploadMediaMutation = useUploadMediaMutation()
  const updateDishMutation = useUpdateDishMutation()
  const { data } = useGetDishQuery({ enabled: Boolean(id), id: id as number })

  const form = useForm<UpdateDishBodyType>({
    resolver: zodResolver(UpdateDishBody),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      image: undefined,
      status: DishStatus.Unavailable
    }
  })
  const image = form.watch('image')
  const name = form.watch('name')
  const previewAvatarFromFile = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file)
    }
    return image
  }, [file, image])

  useEffect(() => {
    if (data) {
      const { name, image, description, price, status } = data.payload.data
      form.reset({
        name,
        // image nếu không có thì sẽ lấy là undefined chứ sẽ không lấy là ''
        image: image ?? undefined,
        description,
        price,
        status
      })
    }
  }, [data, form])

  const handleSubmitForm = async (values: UpdateDishBodyType) => {
    if (updateDishMutation.isPending) return
    try {
      let body: UpdateDishBodyType & { id: number } = {
        id: id as number,
        ...values
      }
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        const uploadImageResult = await uploadMediaMutation.mutateAsync(formData)
        const imageUrl = uploadImageResult.payload.data
        body = {
          ...body,
          image: imageUrl
        }
      }
      const result = await updateDishMutation.mutateAsync(body)
      await revalidateApiRequest('dishes-collection')
      toast({
        description: result.payload.message
      })
      reset()
      onSubmitSuccess && onSubmitSuccess()
    } catch (error) {
      handleErrorApi({
        error,
        setError: form.setError
      })
    }
  }

  const reset = () => {
    setId(undefined)
    setFile(null)
  }

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(value) => {
        // value là giá trị boolean, nếu là true thì đã là bật cái dialog lên rồi
        if (!value) {
          reset()
        }
      }}
    >
      <DialogContent className='max-h-screen overflow-auto sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Cập nhật món ăn</DialogTitle>
          <DialogDescription>Các trường sau đây là bắt buộc: Tên, ảnh</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            className='grid auto-rows-max items-start gap-4 md:gap-8'
            id='edit-dish-form'
            onSubmit={form.handleSubmit(handleSubmitForm, (error) => {
              console.log('Checkk error submit form', error)
            })}
            onReset={reset}
          >
            <div className='grid gap-4 py-4'>
              <FormField
                control={form.control}
                name='image'
                render={({ field }) => (
                  <FormItem>
                    <div className='flex items-start justify-start gap-2'>
                      <Avatar className='aspect-square h-[100px] w-[100px] rounded-md object-cover'>
                        <AvatarImage src={previewAvatarFromFile} />
                        <AvatarFallback className='rounded-none'>{name || 'Avatar'}</AvatarFallback>
                      </Avatar>
                      <input
                        type='file'
                        accept='image/*'
                        ref={imageInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setFile(file)
                            field.onChange('http://localhost:3000/' + file.name)
                          }
                        }}
                        className='hidden'
                      />
                      <button
                        className='flex aspect-square w-[100px] items-center justify-center rounded-md border border-dashed'
                        type='button'
                        onClick={() => imageInputRef.current?.click()}
                      >
                        <Upload className='h-4 w-4 text-muted-foreground' />
                        <span className='sr-only'>Upload</span>
                      </button>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='name'>Tên món ăn</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Input id='name' className='w-full' {...field} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='price'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='price'>Giá</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Input id='price' className='w-full' {...field} type='number' />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='description'>Mô tả sản phẩm</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Textarea id='description' className='w-full' {...field} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => {
                  return (
                    <FormItem>
                      <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                        <Label htmlFor='description'>Trạng thái</Label>
                        <div className='col-span-3 w-full space-y-2'>
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Chọn trạng thái' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DishStatusValues.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {getVietnameseDishStatus(status)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <FormMessage />
                      </div>
                    </FormItem>
                  )
                }}
              />
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='edit-dish-form'>
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditDish