'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { UpdateMeBody, UpdateMeBodyType } from '@/schemaValidations/account.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUploadMediaMutation } from '@/queries/useMedia'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAccountMe, useUpdateMeMutation } from '@/queries/useAccount'
import { handleErrorApi } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

const UpdateProfileForm = () => {
  const [file, setFile] = useState<File | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const { data } = useAccountMe()
  const uploadMutation = useUploadMediaMutation()
  const updateMeMutation = useUpdateMeMutation()
  const form = useForm<UpdateMeBodyType>({
    resolver: zodResolver(UpdateMeBody),
    defaultValues: {
      name: '',
      avatar: ''
    }
  })

  const router = useRouter()

  const avatar = form.watch('avatar')
  const name = form.watch('name')
  // Nếu là nextjs15 thì chúng ta cần gọi luôn thằng  function previewAvatar thì chúng ta sẽ làm như thế này
  // const previewAvatar = (() => (file ? URL.createObjectURL(file) : avatar))()

  const previewAvatar = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file)
    }
    // Ban đầu khi mà vào chúng ta set avatar từ profile me vào thì sẽ lấy từ avatar từ đó còn khi mà có avatarPreview  rồi thì sẽ chọn
    return avatar
  }, [file, avatar])

  useEffect(() => {
    if (data) {
      const { name, avatar } = data?.payload.data
      form.reset({
        name,
        avatar: avatar ?? ''
      })
    }
  }, [data, form])

  const handleResetProfile = () => {
    form.reset()
    setFile(null)
  }

  const handleSubmitProfile = async (values: UpdateMeBodyType) => {
    if (updateMeMutation.isPending) return
    try {
      let bodySubmit = values
      if (file) {
        // Chúng ta chi dùng cái file này để mà chúng ta upload lên thôi
        const formData = new FormData()
        formData.append('file', file)
        // CallAPi upload ảnh
        const uploadImageResult = await uploadMutation.mutateAsync(formData)
        const imageUrl = uploadImageResult.payload.data
        // Nếu mà có file thì gán lại như này
        bodySubmit = {
          ...values,
          avatar: imageUrl
        }
      }
      const result = await updateMeMutation.mutateAsync(bodySubmit)
      toast({
        description: result.payload.message
      })
      router.refresh()
    } catch (error) {
      handleErrorApi({
        error,
        setError: form.setError
      })
    }
  }

  return (
    <Form {...form}>
      <form
        noValidate
        className='grid auto-rows-max items-start gap-4 md:gap-8'
        onReset={handleResetProfile}
        onSubmit={form.handleSubmit(handleSubmitProfile, (err) => {
          console.log('Error when click onSubmit', err)
        })}
      >
        <Card x-chunk='dashboard-07-chunk-0'>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid gap-6'>
              <FormField
                control={form.control}
                name='avatar'
                render={({ field }) => (
                  <FormItem>
                    <div className='flex items-start justify-start gap-2'>
                      <Avatar className='aspect-square h-[100px] w-[100px] rounded-md object-cover'>
                        <AvatarImage src={previewAvatar} />
                        <AvatarFallback className='rounded-none'>{name}</AvatarFallback>
                      </Avatar>
                      <input
                        type='file'
                        ref={avatarInputRef}
                        accept='image/*'
                        className='hidden'
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setFile(file)
                            // Mục đích là khi mà chúng ta onChange thì cái avatar nó là một cái URL để mà nó vượt qua được cái validate của thằng zod
                            // Bởi vì thằng server nó chỉ chịu là đường dẫn URL nên chúng ta cần phải làm vậy
                            // Vì chúng ta chỉ sử dụng giá trị là `file` upload ảnh lên đâu có liên quan gì tới thằng localhost:3000/name này cũng chúng ta, thường thì chúng ta sẽ hay fake chỗ này
                            field.onChange('http://localhost:3000/' + field.name)
                          }
                        }}
                      />
                      <button
                        className='flex aspect-square w-[100px] items-center justify-center rounded-md border border-dashed'
                        type='button'
                        onClick={() => avatarInputRef?.current?.click()}
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
                    <div className='grid gap-3'>
                      <Label htmlFor='name'>Tên</Label>
                      <Input id='name' type='text' className='w-full' {...field} />
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <div className='flex items-center gap-2 md:ml-auto'>
                <Button variant='outline' size='sm' type='reset'>
                  Hủy
                </Button>
                <Button size='sm' type='submit'>
                  Lưu thông tin
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}

export default UpdateProfileForm
