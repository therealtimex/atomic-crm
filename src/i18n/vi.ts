export const viMessages = {
  crm: {
    nav: {
      dashboard: "Bảng điều khiển",
      contacts: "Liên hệ",
      companies: "Công ty",
      deals: "Giao dịch",
      tasks: "Công việc",
    },
    view: {
      table: "Bảng",
      kanban: "Kanban",
    },
    action: {
      new_task: "Tạo công việc",
      new_deal: "Tạo giao dịch",
    },
    filter: {
      active: "Đang hoạt động",
      active_filters: "Bộ lọc đang áp dụng",
      contact: "Liên hệ",
      company: "Công ty",
      deal: "Giao dịch",
      loading: "Đang tải...",
      my_tasks: "Công việc của tôi",
      assigned_to: "Giao cho",
      archived: "Đã lưu trữ",
      priority: "Ưu tiên",
      remove: "Xóa bộ lọc %{filter}",
      search: "Tìm kiếm",
      status: "Trạng thái",
    },
    task: {
      column: {
        expand: "Mở rộng cột %{column}",
        collapse: "Thu gọn cột %{column}",
      },
      field: {
        task: "Công việc",
        related_to: "Liên quan đến",
        due_date: "Ngày đến hạn",
        priority: "Ưu tiên",
        status: "Trạng thái",
        assigned_to: "Người phụ trách",
        actions: "Thao tác",
      },
      status: {
        todo: "Cần làm",
        in_progress: "Đang thực hiện",
        blocked: "Bị chặn",
        done: "Hoàn thành",
        cancelled: "Đã hủy",
        other: "Khác",
      },
      priority: {
        low: "Thấp",
        medium: "Trung bình",
        high: "Cao",
        urgent: "Khẩn cấp",
      },
      type: {
        none: "Không",
        email: "Email",
        demo: "Demo",
        lunch: "Bữa trưa",
        meeting: "Họp",
        follow_up: "Theo dõi",
        thank_you: "Cảm ơn",
        ship: "Giao hàng",
        call: "Cuộc gọi",
      },
    },
    note: {
      status: {
        cold: "Lạnh",
        warm: "Ấm",
        hot: "Nóng",
        in_contract: "Đang ký hợp đồng",
      },
    },
    deal: {
      field: {
        category: "Danh mục",
      },
      stage: {
        opportunity: "Cơ hội",
        proposal_sent: "Đề xuất đã gửi",
        in_negociation: "Đang đàm phán",
        won: "Thành công",
        lost: "Thất bại",
        delayed: "Trì hoãn",
      },
      category: {
        other: "Khác",
        copywriting: "Viết nội dung",
        print_project: "Dự án in ấn",
        ui_design: "Thiết kế UI",
        website_design: "Thiết kế website",
      },
    },
    contact: {
      gender: {
        male: "Anh/Anh",
        female: "Chị/Chị",
        nonbinary: "Họ/Họ",
      },
    },
    company: {
      sector: {
        communication_services: "Dịch vụ truyền thông",
        consumer_discretionary: "Tiêu dùng không thiết yếu",
        consumer_staples: "Hàng tiêu dùng thiết yếu",
        energy: "Năng lượng",
        financials: "Tài chính",
        health_care: "Y tế",
        industrials: "Công nghiệp",
        information_technology: "Công nghệ thông tin",
        materials: "Vật liệu",
        real_estate: "Bất động sản",
        utilities: "Tiện ích công cộng",
      },
    },
  },
  ra: {
    action: {
      clear_array_input: "Xóa danh sách",
      create_item: "Tạo %{item}",
      remove_all_filters: "Xóa tất cả bộ lọc",
      reset: "Đặt lại",
      search_columns: "Tìm kiếm cột",
      select_all: "Chọn tất cả",
      select_all_button: "Chọn tất cả",
      select_row: "Chọn hàng này",
      update: "Cập nhật",
      move_up: "Di chuyển lên",
      move_down: "Di chuyển xuống",
      open: "Mở",
      toggle_theme: "Chuyển chế độ sáng/tối",
      select_columns: "Cột",
      update_application: "Tải lại ứng dụng",
    },
    page: {
      access_denied: "Truy cập bị từ chối",
      authentication_error: "Lỗi xác thực",
    },
    message: {
      access_denied: "Bạn không có quyền truy cập trang này",
      authentication_error:
        "Máy chủ xác thực trả về lỗi và không thể kiểm tra thông tin đăng nhập của bạn.",
      auth_error: "Đã xảy ra lỗi khi xác thực token.",
      bulk_update_content:
        "Bạn có chắc muốn cập nhật %{name} %{recordRepresentation}? |||| Bạn có chắc muốn cập nhật %{smart_count} mục này?",
      bulk_update_title:
        "Cập nhật %{name} %{recordRepresentation} |||| Cập nhật %{smart_count} %{name}",
      clear_array_input:
        "Bạn có chắc muốn xóa toàn bộ danh sách?",
      select_all_limit_reached:
        "Có quá nhiều phần tử để chọn tất cả. Chỉ %{max} phần tử đầu tiên được chọn.",
      placeholder_data_warning:
        "Sự cố mạng: không thể làm mới dữ liệu.",
    },
    navigation: {
      clear_filters: "Xóa bộ lọc",
      no_filtered_results:
        "Không tìm thấy %{name} với bộ lọc hiện tại.",
      partial_page_range_info:
        "%{offsetBegin}-%{offsetEnd} trong hơn %{offsetEnd}",
      current_page: "Trang %{page}",
      page: "Đi tới trang %{page}",
      first: "Đi tới trang đầu",
      last: "Đi tới trang cuối",
      previous: "Đi tới trang trước",
      skip_nav: "Bỏ qua tới nội dung",
    },
    sort: {
      sort_by: "Sắp xếp theo %{field_lower_first} %{order}",
      ASC: "tăng dần",
      DESC: "giảm dần",
    },
    auth: {
      email: "Email",
    },
    notification: {
      not_authorized: "Bạn không được phép truy cập tài nguyên này.",
      application_update_available: "Có phiên bản mới.",
      offline: "Không có kết nối. Không thể tải dữ liệu.",
    },
    validation: {
      unique: "Phải là duy nhất",
    },
    saved_queries: {
      label: "Truy vấn đã lưu",
      query_name: "Tên truy vấn",
      new_label: "Lưu truy vấn hiện tại...",
      new_dialog_title: "Lưu truy vấn hiện tại dưới dạng",
      remove_label: "Xóa truy vấn đã lưu",
      remove_label_with_name: "Xóa truy vấn \"%{name}\"",
      remove_dialog_title: "Xóa truy vấn đã lưu?",
      remove_message:
        "Bạn có chắc muốn xóa mục này khỏi danh sách truy vấn đã lưu?",
      help: "Lọc danh sách và lưu truy vấn này để dùng sau",
    },
    configurable: {
      customize: "Tùy chỉnh",
      configureMode: "Cấu hình trang này",
      inspector: {
        title: "Trình kiểm tra",
        content: "Di chuột lên các thành phần giao diện để cấu hình",
        reset: "Đặt lại cấu hình",
        hideAll: "Ẩn tất cả",
        showAll: "Hiện tất cả",
      },
      Datagrid: {
        title: "Bảng dữ liệu",
        unlabeled: "Cột chưa có nhãn #%{column}",
      },
      SimpleForm: {
        title: "Biểu mẫu",
        unlabeled: "Trường chưa có nhãn #%{input}",
      },
      SimpleList: {
        title: "Danh sách",
        primaryText: "Văn bản chính",
        secondaryText: "Văn bản phụ",
        tertiaryText: "Văn bản thứ ba",
      },
    },
  },
  "ra-supabase": {
    auth: {
      password_reset:
        "Vui lòng kiểm tra email để nhận thông báo đặt lại mật khẩu.",
    },
  },
};
