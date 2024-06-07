# Project NextJS 14 - Xây dựng PosApp

## Profile cá nhân

### Get Me Profile

- Khi mà khởi tạo project thì chúng ta sẽ khởi tạo một cái `accountAdmin` để mà người dùng vào tạo `nhân viên`, quản lí nhân viên và tạo món ăn

### Copy UI setting template

- Những cái data được rendering từ cái API chúng ta gọi từ server thì những cái HTML đó mới không rendering sẵn thôi còn những thầng khác trong `use client` component thì nó vẫn được `pre-rendering` sẵn

  - Về cái use client thì một phần nó vẫn được render sẵn ở phía server và trả về cho client và khi mà rende ra

  - Và sau đó RSC của server mới call tới clientComponent một lần nữa để mà đồng bộ lại DOM, sự kiện trong component đó

  - Chỉ những cái content nào chúng ta fetchApi xong rồi chúng ta render ra ấy -> Thì nó mới không được `pre-render` sẵn ở phía server ở `client-component` mà thôii

- Việc custom lại cái hooks của useQuery thì nằm trong cái bài giảng này

### Hiển thị thông tin profile và preview avatar

- Thực hiện chức năng hiển thị thông tin profile và preview avatar

- Khi mà thông tin người dùng có upload image thì khi mà chúng ta nhấn submit thì chúng ta sẽ cho upload cái `imageAvatar` của người dùng lên thì chúng ta sẽ lấy được cái `URL` như là một trường `avatar` cùng với đó là trường `name` của người dùng và gộp lại thành một `JSON` rồi chúng ta tiến hành upload lên server

- Cần phải có onChange khi mà nhấn vào `button` upload để mà nó show ra cái `input = file`

- Phải có một cái `ref` để mà khi nhấn vào thằng button thì cái input nó mới `onChange` được

- Khi mà chọn hình anh rồi chúng ta cần phải lưu vào một state để mà preview cái hình ảnh đấy

- Sau khi mà đã lấy được cái file rồi thì nhiệm vụ của chúng ta là đưa cái file vào khu vực image để mà `preview` ra

- Trước khi mà xử lý upload thì chúng ta cần phải cho phép nó fetch data ra đã -> Giống như cái tên của profile thì chúng ta cần phải show nó ra

- Giống như đã nói ở các lần trước là khi mà useQuery gọi thành công thì

  - Một là chúng ta dùng useEffect để xử lý cái hàm được gọi kế tiếp

  - Hai là chúng ta custom lại cái hooks là `useQueary` để mà cho cái useQuery của chúng ta nó gọn đi

- Cái lý do mà thằng setting nó không gọi được `useGetMeProfile` là khi mà vào trang web thì cái thằng `useGetMeProfile` nó được gọi và caching lại ở phía của `user-dropdown` nên là khi mà tới cái thằng `update-profile-form` gọi `useGetMeProfile` thì nó sẽ lấy kết quả đã được caching trước ở thằng `user-dropdown` rồi

  - Nên là nó đâu có hàm `onSuccess` được truyền vào đâu nên là nó không thể nào mà reset giá trị trong form tcho chúng được

  - Thế nên là chỗ na ỳ chúng ta sẽ xử lý như sau

  - Sẽ có 2 trường hợp để mà xử lý chỗ này

    - Một là chúng ta cho nó gọi API 2 lần luôn và không có caching cái gì cả

    - Hai là sẽ cho nó caching và gọi 1 lần duy nhất, vì cái phần caching đó cũng hay nó có thể giúp chúng ta giảm tải đến server - Khi mà request nhiều lần

  - Thôi thì chúng ta sẽ sử dụng `useEffect` đó là cách mà chúng ta không có can thiệp nhiều vào cái `API` của thằng `useQuery`

  - Bây giờ chúng ta sẽ thử sử dụng cả 2 cách để mà call hàm `onSucess` khi mà useQuery gọi thành công

  - Sau khi mà xử lý gcTime không được chắc là không can thiệp được vào `useQuery` rồi nên là giờ chúng ta sẽ sử dụng `useEffect` mà thôi

  - Nên là trong trường hợp này chúng ta không còn cách nào khác ngoài việc sử dụng useEffect rồi

### Cập nhật profile cá nhân

### Chức năng đổi mật

### Chức năng cập nhật
