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

- thực hiện logic login cho trang web của chúng ta

### Phân tích ưu nhược điểm 2 cơ chế quản lý đăng nhập ở server và client

- Phân tích ưu nhược điểm của 2 cơ chế quản lý đăng nhập ở `server` và `client`

- Và cũng thực hiện logic là ẩn hiện cái menu khi mà đăng nhập thành công -> Cho phù hợp với logic của doanh nghiệp

- Khuyết điểm mà quản lí trạng thái đăng nhập ở trên server bầng cookies là nó sẽ biến cái page nào có dùng cookie thành `dynamic rendering` thì nó sẽ không có build ra HTML sẵn cho chúng ta

  - Vì cookie là một dynamic function nên là khi dùng nó sẽ biến cái page của chúng ta thành `dynamic rendering` -> Thì thằng này nó không trả có build ra cái HTML sẵn khi mà người dùng request vào thì nó mới tạo ra HTML -> Có nghĩa là khi mà người dùng request tới page là `dynamic rendering` thì thằng `nextServer` nó phải tốn một chút thời gian để mà `build(tạo)` ra `đoạn mã HTML` và trả về cho người dùng

  - Còn thằng static thì nó đã được build ra `HTMl sẵn` rồi -> Nên là khi mà người dùng request tới serverNext thì nó chỉ cần tả về đoạn HTML đã được render sẵn rồi

  - Mỗi cái `request` người dùng lên `serverNext` mà nó cứ tạo ra một đoạn mã HTML thì nó sẽ làm `tăng tải` lên serverNext của chúng ta như vậy thì sẽ không tốt

    - dynamic rendering (server render on demand)

  - Dùng cookie cũng được nhưng mà để tối ưu khi mà người dùng ngta truy cập vào lẹ thì nên sử dụng `static rendering`

- Không dùng cookie nữa thì làm sao để mà biết được là người dùng đã `đăng nhập` ở trên server hay chưa -> Với cơ chế authentication của chúng ta hiện tại không dùng cookie thì sẽ không biết được luôn

  - Trừ khi chúng ta có tạo một cái database gì đó trên server rồi và thz NextJS truy cập trực tiếp tới `database` đó thì mai ra

  - CÒn bây giờ chúng ta dùng cookie thif treen server không có cách nào khác -> hiện tại chỉ có thể check ở client mà thôi

  - Check ở client thì nó vẫn đảm bao cho chúng ta là `Static rendering`

- Check ở client thì chúng ta sẽ sử dụng `localStorage`

  - Những cái page nào nằm trongn public thì đều chịu cái `layout` cả -> Nên là nó sẽ bị ảnh hưởng bởi thằng `NavItems` nếu mà chúng ta sử dụng `cookies` `next/header` ở trong cái `NavItems` đó

  - Nên là chúng ta sẽ sử dụng cái `use client` -> check ở client bằng `localStorage`

  - Mặc dù đã khai báo `use client` rồi mà nó vẫn thông báo cho chúng ta là localStorage `is not defined`

  - Thằng localStorage thì nó chỉ có giá trị khi mà chúng ta chạy trong môi trường browser là môi trường client

  - Còn khi mà chúng ta sử dụng `use client` thì cái component của chúng ta sẽ chạy ở 2 môi trường

    - Một là khi mà chúng ta build cái project

    - Hai là chạy ở môi trường browser -> Thì câu lệnh npm run dev là mô phỏng một phần nào của quá trình build nên là nó lỗi trước cho chúng ta luôn

  - Thì khi mà xử lý ở môi trường browser rồi thì nó vẫn chưa xong đâu vẫn còn một vài cái vấn đề nữa

  - Sẽ có vấn đề khi mà code NextJS thì chúng ta sẽ gặp liên tục luôn

    - Đó là vấn đề về trường hợp ở server client hiển thị nội dung khác nhau khi mà người dùng đã đăng nhập -> Và dùng cái accessToken để mà hiển thị thông tin -> Này xảy ra khi mà chúng ta đã đăng nhập rồi - `server` và `client` nó sẽ không đồng nhất về trạng thái

    - Lỗi này xay ra do quá trình hydration khi mà React nó convert pre-render HTML từ server nó không có giống nhau

    - Thì có một số cách fix đó là có thể dùng `useEffect` trên `client only` mà thôi -> Thay vì mà phải check trong quá trình render thì chúng ta sẽ check trong cái useEffect -> Rồi mới render ra một lần nữa thì nó sẽ không bị lỗi

    - Hoặc là disable cái SSR trên component cụ thể

    - Hoặc là dùng tag `SuppressHydrationWarning` là được

    - Nhưng mà cách này sẽ có một nhược điểm là nó sẽ bị chớp khi mà người dùng F5 lại

      - Thì phải chấp nhận

      - Nếu không t hì cần phải cho nó render ở trên server mỗi khi mà người dùng nhấp vào -> Cái cách đấy sẽ đảm bảo là nó không bị chớp

      - Thì cách 2 chúng ta sẽ chấp nhận nó bị chớp một tí -> Nhưng đổi lại thì chúng ta sẽ được một trang là `static rendering` rằng nó sẽ render ra HTML khi mà chúng ta `build`

### Dùng middle điều hướng request người dùng

- Dùng middleware để điều hướng request người dùng

- Chúng ta sẽ sử dụng middleware để mà điều hướng request người dùng

- middleware để mà ngăn chặn thao tác người dùng vào những cái page có quyền hoặc là những page không có quyền , cái middleware này nó sẽ chạy ở môi trường server

### Code router handler logout

- Cái logout của chúng ta dù sau đi nữa thì chngs ta vẫn cho nó thành công -> Kiều gì thì chúng ta cũng cho họ logout mặc dù cho đó có bị lỗi thì chúng ta sẽ xóa cookie và xóa localStorage luôn

- Tóm lại khi mà logout thì kiểu gì chúng ta cũng cho nó xóa khỏi cái cookie,nếu mà trương hợp người dùng có gửi lên hay không gửi lên thì vẫn cho nó là `status: 200`

  - Khi mà có lỗi thì cứ cho status là 200 chứ không cho cái khác thì bên FE toast lên lỗi thì nó sẽ không hay cho lắm,

  - Dù sao đi chăng nữa thì chúng ta vẫn cho phép người dùng logout ra khi mà AT và RT hết hạn không cần biết là ngdung có gửi lên AT hay RT hay không

- Đã đăng xuất thành công từ logout route handler

### Code logic logout

- Thực hiện logic logout ở trên UI - `clientComponent`

- Khi mà logout xong rồi thì cho người dùng quay chở lại trang

- Trường hợp khi mà gọi API thành công thì chúng ta có thể custom lại để mà thực hiện một cái hành động gì đó ở trong `queryFn` đều được

### Xử lý tự động refreshToken khi mà accessToken hết hạn
