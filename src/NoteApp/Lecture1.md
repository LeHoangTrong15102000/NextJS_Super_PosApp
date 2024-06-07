# Project NextJS 14 - Xây dựng PosApp

## Profile cá nhân

### Get Me Profile

- Khi mà khởi tạo project thì chúng ta sẽ khởi tạo một cái `accountAdmin` để mà người dùng vào tạo `nhân viên`, quản lí nhân viên và tạo món ăn

### Copy UI setting template

- Những cái data được rendering từ cái API chúng ta gọi từ server thì những cái HTML đó mới không rendering sẵn thôi còn những thầng khác trong `use client` component thì nó vẫn được `pre-rendering` sẵn

  - Về cái use client thì một phần nó vẫn được render sẵn ở phía server và trả về cho client và khi mà rende ra

  - Và sau đó RSC của server mới call tới clientComponent một lần nữa để mà đồng bộ lại DOM, sự kiện trong component đó

  - Chỉ những cái content nào chúng ta fetchApi xong rồi chúng ta render ra ấy -> Thì nó mới không được `pre-render` sẵn ở phía server ở `client-component` mà thôii

### Hiển thị thông tin profile và preview avatar

- Thực hiện chức năng hiển thị thông tin profile và preview avatar

### Cập nhật profile cá nhân

### Chức năng đổi mật

### Chức năng cập nhật
