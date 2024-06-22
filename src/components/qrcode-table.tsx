'use client'
import { getTableLink } from '@/lib/utils'
import QRCode from 'qrcode'
import { useEffect, useRef } from 'react'

export const QRCodeTable = ({
  token,
  tableNumber,
  width = 250
}: {
  token: string
  tableNumber: number
  width?: number
}) => {
  // Nên là ở đây là chúng ta sẽ sử dụng ref bơi vì 2 cái component QR code cùng một page thì nó sẽ bị trùng id
  const canvasRef = useRef<HTMLCanvasElement>(null)

  //
  useEffect(() => {
    // Hiện tại: Thư viện QRCode nó sẽ vẽ lên cái thẻ Canvas
    // Bây giờ: Chúng ta sẽ tạo 1 cái thẻ canvas ảo để thư viện QRCode code nó vẽ QR lên trên đó.
    // Và chúng ta sẽ edit thẻ canvas thật
    // Cuối cùng thì chúng ta sẽ đưa cái thẻ canvas ảo chứa QR Code ở trên vào thẻ Canvas thật
    // const canvas = canvasRef.current!

    // để như vậy để typescript biết là thằng đó không thể là null
    const canvas = canvasRef.current!
    canvas.height = width + 70
    canvas.width = width
    // const qrContext = qrCanvas.getContext('2d')!

    // Khi mà nó đã create ra element rồi thì chúng mới bắt đầu DOM tới nó để mà thay đổi thuộc tính
    // Tạo ra Canvas và style cho cái canvas chứa QR code
    const canvasContext = canvas.getContext('2d')!
    canvasContext.fillStyle = '#fff'
    canvasContext.fillRect(0, 0, canvas.width, canvas.height)

    canvasContext.font = '20px Arial'
    canvasContext.textAlign = 'center'
    canvasContext.fillStyle = '#000'
    canvasContext.fillText(`Bàn số ${tableNumber}`, width / 2, width + 20)
    canvasContext.fillText('Quét mã QR để gọi món', width / 2, width + 50)

    // Tạo ra thẻ canvas ảo để nhập vào thẻ canvas thật
    const virtalCanvas = document.createElement('canvas')

    // Truyền cái element vào và content để tạo ra cái canvas ảo chứa QR code
    QRCode.toCanvas(
      virtalCanvas,
      getTableLink({
        token,
        tableNumber
      }),
      {
        width,
        margin: 4
      },
      // Khi mà generate ra được cái QR code thì nó sẽ chạy vào cái function này
      function (error) {
        if (error) console.error(error)
        // Cuối cùng là lấy cái canvas ảo chứa QR code ở trên vào thẻ canvas thật
        canvasContext.drawImage(virtalCanvas, 0, 0, width, width)
      }
    )
  }, [token, tableNumber, width])

  //  Dùng cái thẻ canvas của html
  return <canvas ref={canvasRef} />
}
