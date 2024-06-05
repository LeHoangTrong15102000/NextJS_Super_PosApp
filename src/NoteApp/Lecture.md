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

### Tạo Login route handler

### Setup Tanstack Query và code logic login

### Code logic logout
