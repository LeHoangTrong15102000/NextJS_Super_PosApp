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

- Sẽ thực hiện cập nhật thông tin người dùng như là `avatar` và `name`

- Khi mà nhấn submit thì chúng ta sẽ kiểm tra là khi mà có `file upload ảnh` thì chúng ta sẽ cho upload ảnh để mà lấy cái `URL ảnh` từ server trả về, còn không thì thôi

- Bởi vì nó là null nên là khi mà onChange thì chúng ta chỉ setFile thôi chứ chúng ta không thay đổi giá trị của thằng `avatar`, nên khi mà chúng ta nhấn onSubmit thì nó sẽ bị lỗi vì nó không vượt qua được cái validation của thằng `zod` là cần một cái `URL` kiểu là string

- Khi mà cập nhật rồi thì cái hình ảnh ở userDropdown của chúng ta vẫn chưa được thay đổi thì làm sao để mà cho nó được cập nhật đây

  - Thì chúng ta sẽ sử dung hàm `refetch` của thằng useQuery để mà call lại API `getAccountMe` thì lúc này thằng `userDropdown` nó sẽ lấy ra cái avatar mới cho chúng ta

  - Hoặc là chúng ta có thể sử dụng hook là useQueryClient và sử dụng method của nó là `invalidateQueries({queryKey: ['account-me']})` là được

### Chức năng đổi mật

- Đã thực hiện việc đổi mật khẩu thành công

### Tự động logout khi mà accessToken hết hạn

- Nhưng trong trường hợp mà chúng ta không dùng web 1 thời gian. Chúng ta enter url vào thì sẽ bị hiện tượng là redirect về trang logout nhưng không có logout. Thì trong video mình sẽ handle trường hợp này nhé.

- Nhưng do bên NextJS chúng ta có tận 2 môi trường là client và server lận nên là chúng ta cần phải xử lý cả 2 môi trường này

- Trước tiên thì chúng ta sẽ cần phải làm cái trường hợp là khi mà AT hét hạn thì chúng ta cần phải cho nó logout ra

- Mong muốn của chúng ta là phải `logout` ra khi mà AT của chúng ta hết hạn

- Cookies có set AT thì khi mà nó hết hạn thì cái cookie nó sẽ tự động biến mất, còn bên localStorage thì chúng ta cần phải xóa bằng tay không như là bên cookie được

- Khi mà nó hết hạn thì nó sẽ nhảy qua cái `middleware` nó check trước và nó thấy là `isAuth` là false

  - Và nó sẽ redirect chúng ta về trang `login` theo cái logic mà chúng ta đã xử lý ở bên trong cái `middleware` rồi

  - Và chúng ta sẽ thấy là sẽ không có hiện tượng logout nào ở đây cả vì cái `refreshToken` trong cookie vẫn còn và `AT và RT` trong `localStorage` vẫn còn

  - Thì cái ý tưởng của chúng ta vẫn giống như ở bên NextJS free đó chính là chúng ta sẽ tạo ra cái page `logout`

- Khi mà `logoutMutation.mutateAsync` được gọi thì nó sẽ bị thay đổi tham chiếu ngay lập tức

  - Bởi vì cái `logoutMutation` là một cái `object` vì nó là một cái object nên là chúng ta mới có thể `chấm` tới các thuộc tính bên trong của nó được -> thì `logoutMutation` nó sẽ bị thay đổi tham chiếu khi mà chúng ta gọi nó

  - Thì khi mà thay đổi tham chiều thì cái `callBack` trong useEffect nó sẽ bị gọi lại -> Thì nó sẽ xảy ra vòng lặp vô hạn

  - Thì để mà không bị ảnh hưởng từ vòng lặp vô hạn về việc gọi `logout` -> Thì chúng ta sẽ lấy ra luôn method `mutateAsync` của logoutMutation

  - Thì có thằng không phải là api logout của chúng ta mà là API của thằng nextjs nó gọi đến Nextjs để mà lấy ra các `data react` để mà phục vụ cho quá trình `hydration`

- Cái chế độ `strictMode` có thể check cho chúng ta cái trường hợp mà có thể xảy ra trong thực tế là API sẽ gọi 2 lần

  - Dùng abortController thì nó sẽ không hay lắm -> Vì thằng abort nó chỉ `hủy` cái kết quả trả về của chúng ta mà thôi, chứ khi mà chúng ta đã gọi -> Nhưng một khi đã gọi thì thằng server nó vẫn nhận được kết quả và nó xử lý, chỉ hủy kết quả mà nhận về thôi nên là `abortController` thì nó không hay

  - Thì một chút chúng ta sẽ setTimeout cho thằng `logout` APi

  - Chúng ta vẫn để chế độ react strictMode vì t rong thực tế thì cái API đó có thể gọi 2 lần nên là chúng ta cần phải cẩn thận

  - Cho nên là chỗ useEffect chúng ta sẽ xử lý như thế này, mặc dù cái `callback` nó gọi 2 lần đi chăng nữa thì chúng ta sẽ làm cho cái thằng `mutateAsync` nó chỉ gọi 1 lần mà thôi

  - Sẽ thông báo một cái `ref` và sau một giây mới set lại cái ref.current nên là cái `callback` nếu mà nó có chạy 2 lần trong một thời gian ngắn thì nó không thể vượt qua được cái `if (ref.current)` và không thể gọi lần thứ 2 và khi hết `1s` thì thằng ref.current nó sẽ bị set lại là null (Đã xóa đi cái react strictMode rồi thì mặc định nó là true)

  - Thì đây chỉ là một cái trick nhỏ mà thôi

- Trường hợp khi mà người dùng gửi cho chúng ta một cái đường logout vô tình làm chúng ta logout ra thì không hay cho lắm

- Và chúng ta chỉ thực hiện logout khi mà cái accessToken gửi lên nó khớp với cái accessToken trong localStorage thì chúng ta mới cho nó gửi lên mà thôi

- Chỗ privatePath phải check một tí xíu nữa chứ không phải chưa đăng nhập mà lúc nào cũng redirect về `/logout`

- Bây giờ nếu mà có ai gửi cho chúng ta đường link logout thì chắc chắn là chúng ta sẽ không bị `logout` ra

- Còn trường hợp mà khi mà refreshToken cũng hết hạn luôn thì nếu mà người dùng lâu ngày ko vào thì nó sẽ không tự động logout cho người dùng mà nó sẽ bị đứng ở trang `logout`

### Xử lý trường hợp đang dùng thì hết hạn token

- Thì đây chính là cái trường hợp mà chúng ta sẽ dùng `refreshToken` để mà gia hạn `accessToken`
