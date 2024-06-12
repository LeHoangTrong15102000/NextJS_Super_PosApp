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

- Còn trường hợp mà người dùng chưa đăng nhập thật thì lấy đâu ra cái refreshToken để mà `logout` ra được -> Nên là chúng ta sẽ xử lý lại một chút xíu ở phần `middleware`

- Chỗ mà xử lý lỗi 401 khi mà gọi token ở bên http là để xử lý trường hợp gian hạn accessToken mới

### Tự động logout khi mà gọi API bị lỗi 401 ở client component

- Trường hợp này chúng ta cũng đã xử lý ở trong file `HTTP` rồi

### Tự động logout khi gọi API bị lỗi 401 ở server component

- Và đây là trường hợp mà trên server nó handle bị lỗi và trả về lỗi 401 cho chúng ta thì chúng ta cần phải logout người dùng ra khỏi trình duyệt

- Nên là trong trường hợp đây thì chúng ta nên cho cái website chúng ta logout ra

- Thì cái trường hợp mà người dùng vào những client component và bị lỗi 401

- Thì thằng middleware nó chỉ có check là có AT và RT hay không thôi chứ nó không có ch eck là có AT và RT nó có đúng ở trên server hay không bởi vì nó đâu có gọi 1 cái API nào để mà check đâu

- Còn trong cái trường hợp này chúng ta đang nói tới là khi gọi API đến `serverBE` `(Chứ không phải là serverNextJS)` Và vì cái lý do gì đó mà serverBE trả về lỗi 401

- Chúng ta sẽ test cái trường hợp là mỗi thứ nó còn hạn sử dụng, nhưng không biết là vì lý do gì đấy mà nó bị lỗi 401 ở `server component` -> Nên là chúng ta cần phải logout người dùng ra khỏi website

- Khi mà fetchAPI ở serverBE thì nó không có hiện tượng chơp nháy gì cả mà nó sẽ có luôn dữ liệu của chúng ta

- Thì chúng ta sẽ thử sửa lại thằng accessToken ở cookies lại và sau đó reload lại -> Thì thằng middleware nó vẫn cho phép đi qua vì nó kiểm tra là có AT chứ không kt là AT có đúng với AT ở dưới serverBE hay không

- Khi mà chúng ta `redirect` ở serverCOmponent thì nó sẽ throw ra cho chúng ta một lỗi, nếu mà chúng ta catch nó lại thì nó sẽ không có `throw` ra một cách thoải mái và `redirect` người dùng được -> Hiểu đơn giản là khi mà chúng ta mà catch thì nó sẽ không `redirect` được

  - Chúng ta đừng có `try` - `catch` gì thì nó sẽ throw một cách thoải mái

  - Khi mà nó throw lỗi thành công thì nó sẽ `redirect` về trang logout cho chúng ta, còn không khi mà throw thì nó vẫn chạy xuống và return ra đoạn mã `TSX` và sẽ không làm cho chúng ta redirect về trang logout được

  - Nên là nếu mà chúng ta `try-catch` thì chúng ta cần phải check digest là `NEXT_REDIRECT` thì mới được

- Thì những cái trường hợp mà gọi API bị lỗi những cái lỗi không phải 401 thì nó sẽ làm cái trang chúng ta bị `trắng` -> Thì cách nào cũng có cái ưu nhược điểm riêng của nó cả, Và cách xử lý lỗi 401 ở logout như này cũng được

### Phân tích cơ chế refreshToken ở NextJS

`Refresh Token  Trong NextJS`

Các API yêu cầu Authentication có thể được gọi ở 2 nơi

1. Server Component: Ví dụ page `/account/me` cần gọi API `/me` ở server component để lấy thông tin profile của user
2. Client Component: Ví dụ page `/account/me` cần gọi API `/me` ở client component để lấy thông tin profile của user

=> Hết hạn token có thể xảy ra ở Server Component và Client Component

Các trường hợp hết hạn access token

- Đang dùng thì hết hạn: Chúng ta sẽ không để trường hợp này xảy ra, bằng cách có 1 setinterval check token liên tục để refresh token trước khi nó hết hạn

- Chúng ta xử lý cái trường hợp mà đợi AT hết hạn rồi RT thì những cái trường hợp đó vừa phức tạp vừa có thể xảy ra bug nữa -> Nên là chúng ta cần phải xử lý theo cái trường hợp khác là dùng `setInterval` để mà khi còn 10p hay gì đó thì chúng ta sẽ set lại `accessToken`

- Lâu ngày không vào web, vào lại thì hết hạn:

Khi vào lại website thì middleware.ts sẽ được gọi đầu tiên. Chúng ta sẽ kiểm tra xem access token còn không (vì access token sẽ bị xóa khi hết hạn), nếu không còn thì chúng ta sẽ gọi cho redirect về page client component có nhiệm vụ gọi API refresh token và redirect ngược về trang cũ

- Vì khi mà AT hết hạn mà người dùng vào một cái page thì nó sẽ req lên server thì lúc này AT đã hết hạn rồi thì server sẽ tiến hành RT cho người dùng

- Cho redirect về cái page là RT tại cái page đó thì chúng ta sẽ thực hiên RT và sau đó là quay lại trang cũ như ban đâu cho người dùng

  - RT xong rồi thì chúng ta sẽ quay về lại trang cũ cho người dùng

- Trong cái middleware là chúng ta sẽ kiểm tra cái AT có còn không, nếu không còn thì cho redirect về cái page client component

- Vì lúc người dùng off thì đâu có những cái req được gửi tới serverBE đâu nên là đâu biết được là AT còn hạn hay không

  - Nên là khi người dùng onl thì mới gửi req tới cho server thì lúc này mới kiểm tra được là AT còn hạn hay không nên là lúc này mới thực hiện RT cho người dùng

  - Mọi thứ sẽ diễn

Lưu ý để tránh bị bug khi thực hiện Đang dùng thì hết hạn

- Không để refresh token bị gọi duplicate
- Khi refresh token bị lỗi ở route handler => trả về 401 bất kể lỗi gì
- Khi refrest token bị lỗi ở useEffect client => ngừng interval ngay
- Đưa logic check vào layout ở trang authenticated: Không cho chạy refresh token ở những trang mà unauthenticated như: login, logout
- Kiểm tra logic flow trong middleware

### Tạo refreshToken route handler

- Tạo route handler `refresh-token` trong nextJS

- Những gì chinh sửa cookie liên quan tới Nextjs server thì phải thông qua `route handler`

### Xử lý trường hợp đang dùng thì hết hạn token, tiến hành RT để mà gia hạn cho AT

- Nếu mà người dùng đang sử dụng mà AT hết hạn thì chúng ta sẽ gia hạn AT cho người dùng

- Nếu mà AT và RT đều hết hạn thì chúng ta bắt buộc người dùng phải logout ra khỏi `website` -> Và buộc người dùng phải đăng nhập lại thì mới có thể tiếp tục sử dụng website được

- Khi mà đang dùng mà AT gần hết hạn thì chúng ta sẽ RT nhưng nếu mà trong lúc RT có bị lỗi thì lúc đó có thể là do RT hết hạn hoặc là bị vấn đề gì đó thì chúng ta sẽ đá ng dùng về trang login

- Khi mà cóa lỗi 401 thì chúng ta sẽ gọi đến `http` và sẽ redirect ng dùng về trang login, vì thz refreshToken của chúng tá là sẽ thực hiện ở `client component`

- Thực hiện cái trường hợp mà khi chúng ta đang dùng mà cái AT của chúng ta nó hết hạn thì chúng ta sẽ không để cái trường hợp này nó xảy ra và chúng ta sẽ check liên tục cái `setInterval` và refresh nó liên tục trước khi mà nó hết hạn

- Khi mà gọi trong cái app-provider thì cả cái app của chúng ta đều dính cái refresh-token nầy cả

- Khi mà refreshToken thành công mà lần tiếp theo chúng ta lại gửi lên cái RT cũ thì nó sinh ra lỗi -> Để mà giải thích cho cái lý do đấy thì có thể là cái API RT của chúng bị duplicate khi mà gọi hoặc là do thời gian gọi quá suýt sát nhau nên là nó sinh ra lỗi

- Vấn đề là do chúng ta chưa có clean up cái function interval nên là khi mà chúng ta đang gọi mà chúng ta chuyển trang thì thằng kia nó đang gọi và nó chưa có kịp set AT và RT vào localStorage thì thăng kia nó lại lấy lại cái AT và RT cũ và nó thực hiện cái callback-Interval nữa nên là nó sinh ra (Bởi vì khi mà gọi xong cái RT thì thằng database dưới nó sẽ xóa đi cái RT cũ ) - nên là khi cái thằng mới dùng tới RT cũ để thực hiện việc callAPI thì nó sẽ nó sẽ không tìm thấy `RT` ở dưới database và nó sẽ bị lỗi

- Để mà cho nó không bị duplicate nữa thì khai báo một biến là `refreshTokenRequest` để khi mà đang gọi tới API `refresh-token` thì cái biến này sẽ có giá trị và các thằng khác gọi tới để mà thực hiện sẽ không được -> Sẽ tránh được tình trạng `duplicate`

- Trình duyệt bây giờ có cơ chế fetch trước cái trang web của chúng ta mặc dù là chúng ta chưa đi vào trang web -> Thì chắc là cái cơ chế `pre-fetch` cái trang web của chúng ta gi úp cho chúng ta vào cái trang web nó nhanh hơn

  - Thì cơ chế này thì cũng được thôi giúp cho người dùng có trải nghiệm tốt hơn khi mà vào trang web cả AT và RT đều đã hết hạn -> Thì lúc này nó sẽ pre-fetch trước cái `logout` tăng trài nghiệm hơn -> Thay vì người dùng vào rồi nó mới bắt đầu `fetch` và `logout`

### Thực hiện chức năng refreshToken cho người dùng lâu ngày vào và AT hết hạn và thằng RT vẫn còn hạn

- Thì cái trường hợp này chính là cái trường hợp mà người dùng lâu ngày rồi mới vào lại trang web thay vì chúng ta logout ngừơi dùng khi mà họ vào lại trang sau khi lâu rồi không sử dụng

- Thì lúc này chúng ta sẽ thực hiện redirect ng dùng vào một trang khác để mà thực hiện lại RT xong rồi quay lại treang ban đầu -> Cách này sẽ là cách thực hiện đầy đủ hơn của cách bài 34

- Khi vào lại website thì middleware.ts sẽ được gọi đầu tiên. Chúng ta sẽ kiểm tra xem access token còn không (vì access token sẽ bị xóa khi hết hạn), nếu không còn thì chúng ta sẽ gọi cho redirect về page client component có nhiệm vụ gọi API refresh token và redirect ngược về trang cũ

- Lưu ý để tránh bị bug khi thực hiện Đang dùng thì hết hạn

  - Không để refresh token bị gọi duplicate
  - Khi refresh token bị lỗi ở route handler => trả về 401 bất kể lỗi gì
  - Khi refrest token bị lỗi ở useEffect client => ngừng interval ngay
  - Đưa logic check vào layout ở trang authenticated: Không cho chạy refresh token ở - những trang mà unauthenticated như: login, logout
  - Kiểm tra logic flow trong middleware

- Khi mà người dùng lâu ngày không vào thì AT lúc này đã hết hạn và còn RT thì lúc này chúng ta sẽ chuyển ng dùng về trang `refresh-token` để mà `xác thực` lại cho người dùng, để ng dùng có thể thao tác lại được với trang web

- Sau khi mà RT lại cho người dùng rồi thì chúng ta sẽ `redirect` lại cái `route` mà lúc đầu người dùng nhấn vào\

### Xử lý RT hết hạn khi người dùng đang sử dụng trang web

- Xử lý trường hợp mà RT khi mà người dùng đang sử dụng thì nó hết hạn

- Sẽ xử lý nốt cái trường hợp này mà thôi

- Khi mà AT và RT hết hạn mà người dùng vẫn còn đang sử dụng thì `middleware` nó sẽ check và đá người dùng về trang `login` luôn

- Nên là khi mà F5 lại thì middleware nó sẽ check và `logout` người dùng và đá ng dùng về trang `Login`, đồng thời chúng ta cũng sẽ thực hiện việc xóa luôn cả `localStorage`

- Chúng ta sẽ có một bug đó là chúng ta chỉ check cái `onError` ở hàm chạy lần đầu tiên mà thôi mà chúng ta không check ở trong cái `interval` -> bởi vì chính cái function này chúng ta truyền vào cái `setInterval`, nên là có lỗi gì thì chúng ta cũng cần phải clear nó đi

- Ngoài việc xóa `localStorage` `clearInterval` khi mà RT hết hạn c thì chúng ta cũng sẽ redirect người dùng về trang `login`

### Xử lý RT hết hạn khi người dùng lâu ngày không vào lại trang web

- Trường hợp này thì khi mà ng lâu ngày mà vào trang thì lúc này cả AT và RT nó đều hết hạn cả

- Thì lúc này khi mà người dùng lâu ngày không vào trang web -> Thì lúc này khi vào rồi thì user sẽ bị logout ra nhưng sẽ có một cái bug đó là khi mà redirect về trang login rồi nhưng mà cái `navItems` nó sử dụng cái localStorage để mà xác nhận trạng thái nhưng mà cái `localStorage` chúng ta chưa có xóa thì nó sẽ xảy ra bug đó lá trạng thái `navItems` khi mà đăng nhập vẫn còn, mặc dù thì `accessToken` và `refreshToken` đều đã hết hạn rồi

- Nên là nhiệm vụ của chúng ta khi mà redirect về trang `login` thì sẽ xóa khỏi `localStorage` luôn

- Nhưng mà nó cũng tiềm ẩn một cái rủi ro đó chính khi mà cái `loginForm` và `navItems` cùng nằm trên một cái page nên là 2 cái useEffect không biết được là cái nào sẽ chạy trước -> mà may quá là cái useEffect của loginForm chạy trước -> Nên là nó không bị ảnh hưởng đến cái UI của giao diện

- Nhưng mà để hạn chế trường hợp này chúng ta sẽ sử dụng `contextAPI` để mà sử dụng cái state từ contextAPI

- Bây giờ thằng navItems nó có chạy trước hay chạy sau gì thì nó không quan trọng, mỗi lần mà thằng loginForm nó chạy xong thì nó sẽ set cái `isAuth` là false cho chúng ta
