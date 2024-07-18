# NextJS Super PosApp Project

## Chương 9 Quản lý tài khoản nhân viên

- Thực hiện quản lý tài khoản của người dùng

- Những trang như này thì không cần phải SEO làm gì, vì con bot Google nó cũng đâu có thấy được đâu, những trang chúng ta public ra ngoài thì chúng ta hãy nên fetch API ở server, còn lại cứ fetch ở client, vì khi callAPI ở `server` chúng ta sẽ làm cho nó phức tạp hơn

### Hiển thị danh sách account employee list

- Show danh sách tài khoản lên trên cái table

### Edit account employee detail

- Thực hiện việc edit employee account trong listAccount Employee

- Call API `getDetailEmployee` để mà lấy ra cái thông tin cụ thể của thằng employee đó

- Khi mà có trường changePassword truyền lên thì chúng ta mới có thể thay đổi mật
  khẩu được

### Fix bug avatar không load lại khi mà editAccount

- Fix bug cái vấn đề đó

- thì khi mà cập nhật cái ảnh cảu cái tài khoản mà chúng ta lưu thì khi mà quá sửa cái tài khoản của người khác thì nó lại hiển thị ảnh của tài khoảm lúc trước -> Lý do đó chính là cái previewImage nó đang dựa vào cái `file - state` và `avatar - infoUser`

- Thì khi mà chúng ta upload cai file rồi thì cái file của chúng ta nó sẽ có trạng thái -> Nên là khi mà `infoUser` của employee khác thì nó sẽ vẫn hiển thị cái file của ng đó do là cái state `file` vẫn còn trạng thái -> Nên là khi mà chúng ta cập nhật xong thì chúng ta cần tắt cái trạng thái đó đi

## Chương 10 Quản lý món ăn

- Quản lý món ăn

### Khai báo API cho món ăn

- Nếuu mà chúng ta không truyền status lên thì mặc định khi mà callAPI thì nó sẽ trả về là `Available`

## Chương 11 Quản lý bàn ăn

- Quản lý bàn ăn

- QR code sẽ chưa cái token

- Mỗi cái token mà kết hợp vói số bàn thì nó sẽ tạo ra `QR code`

- Nên là chúng ta sẽ lưu cái token tạo ra cái QR code vào `database`, chứ không phải là lưu cái hình vào trong `database`

- Khi mà sửa cái QR code thì sẽ được đổi `token` thành cái `QR code` khác

### Hiển thị danh sách bàn ăn và mã QR code

- Từ cái đường link token thì chúng ta sẽ tạo ra được cái mã `qr code`

- Chỉ khi nào chúng ta nhấn nút changeToken và nhấn nút lưu thì nó mới thay đổi token đi

- Thì cái table của thằng tanstack query thì nó sẽ có một cái là `filterFn` thì thằng này nó sẽ quy định cái function để mà cho nó `filter`

### Thêm thông tin vào QR code Canvas

- Thêm thông tin vào QR code cho chúng ta

### Fix vấn đề refreshToken và không bị redirect về trang login

- Không redirect về trang login mà lại bị `redirect` về trang `Home`

- Khi mà chúng ta không làm tròn nó thì nó vẫn chưa giải quyết được vấn đề -> Thường thì cái cookies nó sẽ bị lệch vài `ms`

- Cái thời điểm mà chúng ta set vào trong cookie thì nó bị lệch vài trăm `ms` -> Nên là cái thời điểm hết hạn của `cookie` nó bị lâu hơn so với thực tế cụ thể là giá trị exp của `refreshToken`

- Chỗ này có thể khi mà chúng ta check là nó hết hạn rồi thì chúng ta redirect về trang `login` nhưng mà `cookies` nó lại chưa hết hạn -> Vì ban đầu chúng ta đã thấy là thằng EXP trên cookies nó chênh lệch với RT ở trong token -> Nó chênh lệch nhau là vài ms

- Mặc đih cái thằng nextjs này nó sẽ cache cái router của chúng ta là 30s kể từ cái lần request gần nhất

- Thì trong vòng 30s đó không có cái `req` nào đến backend thì lấy gì mà nó check(Do cái thằng router thì nó đã bị cache ở phía server Nextjs rồi) -> Do là trong vòng 30s đó không thì thằng router đó không được gọi lại nên là không có cái req nào gửi tới `serverNextjs`

  - Lúc này thì chúng ta bị redirect về login nhưng middleware của chúng ta nó không có logg ra -> Nên là chúng ta cần phải thực hiện -> Sau 30s khi mà chúng ta thay đổi cái route thì nó mới check lại (Nếu mà không có cái req nào đến BE thì lấy gì mà thằng middleware nó check được)

### Update bàn ăn

### Delete bàn ăn

## Chương 12 Trang chủ và caching

### Fetch data tại trang chủ

- Thì ở cái trang này chúng ta có sử dụng SEO cho cái trang này nên là chúng ta cần phải sử dụng Server component ở cái trang này

- Khi mà chúng ta fetch một cái ảnh là localhost thì chúng ta cần phải khai báo nó ở trong `next.config`

- Để tránh trường hợp bị cache khi mà build thì chúng ta nên xoá thư mục `cache` cũ trước khi build ra thư mục mới

  - Và cái cache khi build này nó chỉ có ảnh hưởng tới cái page nào mà sử dụng API mà bị `cache` hay là những page `static rendering` thì nó sẽ bị caching khi mà chúng ta build

  - Còn khi mà chúng ta build những cái page `dynamic` thì nó sẽ không có bị cache khi mà build

### Xử lý caching với kỹ thuật ISR

- Thì khi mà chúng ta build cái project rồi thì nó generate ra cái file html thì cái file đó nó không có thay đổi, thì khi mà chúng ta cập nhật API thì cái file đó cũng không có thay đổi -> Thì nó sẽ gây ra cái vấn đề caching rất là khó chịu

  - Thì đây vừa là một tính năng vừa là một cái khá khó chịu của thằng `nextjs`

  - Thì bây giờ chúng ta mong muốn là mỗi là mà chúng ta cập nhật cái dish ở trang admin thì chỉ mỗi cái file `index.html(Homepage)` thì nó bị làm mới mà thôi

  - Còn những cái file như là `login` `logout` `refreshToken` thì nó không bị làm mới lại

  -> Thì sẽ có một cách, lên trang chủ của nextjs và đọc nội dung `data fetching, caching, Revalidating`

  - Thì sau một khoảng thời gian mà cái `page` nào mà nó sử dụng cái `fetchAPI` này thì nó sẽ tự động build lại cái `index.html` của nó hoặc là chúng ta có thể revalidate dựa trên cái `request` - `on-demand Revalidation`

  - Thì nếu chúng ta muốn nó revalidate ngay lập tức thì nó sẽ sử dụng cái `tags['tag-name']` -> Và chúng ta sẽ sử dụng cái function đó là `revalidaTag`

  - `API revalidaTag` có thể chạy trong một cái `server-action` hoặc là chạy trong một cái `route handler`

  - Khi mà chúng ta cập nhật một cái dishes thành công thì chúng ta gọi đến cái `route handler` là được

  - Khi mà chúng ta revalidate thì nó chưa có build cái file này lại ngay đâu -> Khi mà người dùng người ta vào thì nó mới build lại `có cái request` đến thì nó mới tiến thành build lại

  - Khi mà nó build xong rồi thì những cái req sau đó thì nó chỉ cần dùng cái `index.html` nó xài là được

  - Oke vậy đây chính là cách giúp chúng ta cập nhật lại thằng `data` ở Homepage(server component)

- Thì cái kỹ thuật này áp dụng cho những cái page là `static rendering` -> Khi mà chúng ta buộc nó build lại thì nó sẽ build lại cho chúng ta

## Chương 13 Khách hàng gọi món

## Chương 14 Quản lí đơn hàng

## Chương 15 Dashboard

## Chương 16 Phân quyền nhân viên

## Chương 17 Oauth2.0

## Chương 18 Sử dụngg zustand vào trong dự án
