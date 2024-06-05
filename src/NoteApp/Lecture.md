# Project NextJS 14 - Xây dựng PosApp

## Authentication, Authorization và Permission cho App

### Cài đặt config ENV trong APP

- biến môi trường ở browser thì browser hay server đều có thể thấy được

- Trong khóa NextJS super này của chúng ta thì sẽ không set cookies ở đây

### Setup Postman cho dự án

### Cấu hình http cho dự án

- Login và Logout ở dự án lớn này của chúng ta sẽ có những thay đổi một chút xíu đó là chúng ta sẽ từ clientComponent gọi tới `serverNext` -> Xong rồi từ `serverNext` nó sẽ gọi tới `serverBE` cho chúng ta -> Rồi sẽ trả về kết quả cho `clientComponent`

- Ở `serverComponent` hay `nextServer` để nhận biết là login hay chưa thì dựa vào `cookies` của client nó gửi lên -> Mỗi cái request client gửi lên trên `nextServer` thì nó đều tự động gửi `cookies` lên nextServer cả

- Ở `clientComponent` hay `nextClient` để nhận biết được là login hay chưa thì dựa vào `localStorage`

- Thì đấy là cái trường hợp mà `serverBE` nó dùng cái authorization `Bearer token` - Thì dấy cũng là cái mà chúng ta sử dụng trong cái source BE dự án của chúng ta luôn

- Nếu mà dùng cookies ở serverBE thì chỉ cần dùng cái biến là isLogin là true hay false lưu ở localStorage là được -> Chỉ cần lưu cái biến là isAuth là true hoặc là false trong `localStorage` là được

- Biến `isClient` chạy ở client thì mặc định nó sẽ là true rồi nên là không cần phải khai báo một cái function đâu

- Body của phần logout thì chúng ta sẽ truyền là null luôn -> Ở đây chúng ta sẽ có cái chiến lược đó là

  - Logout thì chúng ta sẽ cho phép luôn luôn thành công

  - Nếu như accessToken có hết hạn đi chăng nũa thì chúng ta vẫn cho logout luôn, khi mà accessToken hết hạn thì server nó sẽ không chấp nhận nhưng mà chúng ta vẫn cho logout bằng cách là xóa accessToken ở trong localStorage và trong cookies của chúng ta luôn

  - Logout thì chúng ta vẫn luôn luôn cho thành công cho dù có hết hạn hay không -> Nên là ở đây chúng ta không cần truyền cái `force = true` hay gì cả

### Tạo Login route handler

- Tạo route handler cho thằng `login`

- Chúng ta mong muốn ng dùng gửi cái body lên như là gửi lên `serverBE` của chúng ta vậy -> Thì chúng ta muốn là gọi tới cái `route handler` là cũng như vậy

- Sau khi mà nhận được accessToken và refreshToken từ `serverBE` trả về cho `nextServer` thì chúng ta sẽ tiến hành `decode`

  - Mục đích decode là chúng ta lấy ra được thời điểm hết hạn của AT và

  - Khi mà lấy ra được thời điểm hết hạn rồi thì chúng ta sẽ set cookies -> Vì cookies chúng ta phải quy định cái thời điểm hết hạn cho nó, chứ không thể để cookies tồn tại mãi mãi được

- Khi mà lấy ra được thời gian hết hạn của AT và RT rồi thì chúng ta sẽ set `cookies` cho client.com

  - cú pháp set cookies trong nextjs thì nó sẽ như sau: cookies.set(name, value, options())

    - options chứa `expires: timestamp`

  - set httpOnly để mà ngăn chặn client truy cập tới cookies để tránh bị tấn XSS từ phía ngoài và tránh các đoạn mã độc

  - Khi mà client gửi `req` lên server thì cookie nó sẽ được tự động gửi lên server

  - Thì cái exp ở bên `cookies-Next` nó nhận vào là `ms`

### Setup Tanstack Query và code logic login

### Phân tích ưu nhược điểm 2 cơ chế quản lý đăng nhập ở server và client

### Dùng middle điều hướng request người dùng

### Code logic logout
