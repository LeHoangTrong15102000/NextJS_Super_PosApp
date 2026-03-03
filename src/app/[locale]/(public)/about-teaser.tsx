import { Link } from '@/i18n/routing'
import { ArrowRight } from 'lucide-react'

export default function AboutTeaser() {
  return (
    <section className='py-16 px-4 md:px-8 bg-muted/30'>
      <div className='max-w-3xl mx-auto text-center'>
        <h2 className='text-2xl md:text-3xl font-bold mb-4'>Về chúng tôi</h2>
        <p className='text-muted-foreground leading-relaxed mb-6'>
          Big Boy Restaurant tự hào mang đến những trải nghiệm ẩm thực tuyệt vời với nguyên liệu tươi ngon,
          được chế biến bởi đội ngũ đầu bếp giàu kinh nghiệm. Chúng tôi cam kết phục vụ bạn với chất lượng
          tốt nhất trong không gian ấm cúng và thân thiện.
        </p>
        <Link
          href='/about'
          className='inline-flex items-center gap-2 text-primary font-medium hover:underline transition-colors'
        >
          Tìm hiểu thêm
          <ArrowRight className='h-4 w-4' />
        </Link>
      </div>
    </section>
  )
}

