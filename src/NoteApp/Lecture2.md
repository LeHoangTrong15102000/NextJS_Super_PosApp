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

### Update bàn ăn

### Delete bàn ăn

## Chương 12 Quản lý đơn hàng

- Quản lý đơn hàng
