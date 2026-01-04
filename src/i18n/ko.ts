export const koMessages = {
  crm: {
    nav: {
      dashboard: "대시보드",
      contacts: "연락처",
      companies: "회사",
      deals: "딜",
      tasks: "작업",
    },
    view: {
      table: "테이블",
      kanban: "칸반",
    },
    action: {
      new_task: "새 작업",
      new_deal: "새 딜",
    },
    filter: {
      active: "활성",
      active_filters: "활성 필터",
      contact: "연락처",
      company: "회사",
      deal: "딜",
      loading: "로딩 중...",
      my_tasks: "내 작업",
      assigned_to: "담당자",
      archived: "보관됨",
      priority: "우선순위",
      remove: "%{filter} 필터 제거",
      search: "검색",
      status: "상태",
    },
    task: {
      column: {
        expand: "%{column} 열 펼치기",
        collapse: "%{column} 열 접기",
      },
      field: {
        task: "작업",
        related_to: "관련",
        due_date: "마감일",
        priority: "우선순위",
        status: "상태",
        assigned_to: "담당자",
        actions: "동작",
      },
      status: {
        todo: "할 일",
        in_progress: "진행 중",
        blocked: "차단됨",
        done: "완료",
        cancelled: "취소됨",
        other: "기타",
      },
      priority: {
        low: "낮음",
        medium: "보통",
        high: "높음",
        urgent: "긴급",
      },
      type: {
        none: "없음",
        email: "이메일",
        demo: "데모",
        lunch: "점심",
        meeting: "회의",
        follow_up: "후속 조치",
        thank_you: "감사",
        ship: "배송",
        call: "전화",
      },
    },
    note: {
      status: {
        cold: "콜드",
        warm: "웜",
        hot: "핫",
        in_contract: "계약 중",
      },
    },
    deal: {
      field: {
        category: "카테고리",
      },
      stage: {
        opportunity: "기회",
        proposal_sent: "제안 발송됨",
        in_negociation: "협상 중",
        won: "성공",
        lost: "실패",
        delayed: "지연",
      },
      category: {
        other: "기타",
        copywriting: "카피라이팅",
        print_project: "인쇄 프로젝트",
        ui_design: "UI 디자인",
        website_design: "웹사이트 디자인",
      },
    },
    contact: {
      gender: {
        male: "그/그",
        female: "그녀/그녀",
        nonbinary: "그들/그들",
      },
    },
    company: {
      sector: {
        communication_services: "커뮤니케이션 서비스",
        consumer_discretionary: "경기소비재",
        consumer_staples: "필수소비재",
        energy: "에너지",
        financials: "금융",
        health_care: "헬스케어",
        industrials: "산업재",
        information_technology: "정보기술",
        materials: "소재",
        real_estate: "부동산",
        utilities: "유틸리티",
      },
    },
  },
  ra: {
    action: {
      clear_array_input: "목록 지우기",
      create_item: "%{item} 만들기",
      remove_all_filters: "모든 필터 제거",
      reset: "초기화",
      search_columns: "열 검색",
      select_all: "전체 선택",
      select_all_button: "전체 선택",
      select_row: "이 행 선택",
      unselect: "선택 해제",
      open_menu: "메뉴 열기",
      close_menu: "메뉴 닫기",
      update: "업데이트",
      move_up: "위로 이동",
      move_down: "아래로 이동",
      open: "열기",
      toggle_theme: "라이트/다크 모드 전환",
      select_columns: "열",
      update_application: "애플리케이션 새로고침",
    },
    boolean: {
      null: " ",
    },
    page: {
      empty: "%{name}가 아직 없습니다.",
      invite: "추가하시겠습니까?",
      access_denied: "접근 거부",
      authentication_error: "인증 오류",
    },
    input: {
      password: {
        toggle_visible: "비밀번호 숨기기",
        toggle_hidden: "비밀번호 표시",
      },
    },
    message: {
      access_denied: "이 페이지에 접근할 권한이 없습니다.",
      authentication_error:
        "인증 서버가 오류를 반환하여 자격 증명을 확인할 수 없습니다.",
      auth_error: "인증 토큰을 검증하는 동안 오류가 발생했습니다.",
      bulk_update_content:
        "%{name} %{recordRepresentation}을(를) 업데이트하시겠습니까? |||| 이 %{smart_count}개의 항목을 업데이트하시겠습니까?",
      bulk_update_title:
        "%{name} %{recordRepresentation} 업데이트 |||| %{smart_count}개의 %{name} 업데이트",
      clear_array_input: "목록 전체를 지우시겠습니까?",
      select_all_limit_reached:
        "선택할 요소가 너무 많습니다. 처음 %{max}개만 선택되었습니다.",
      unsaved_changes:
        "일부 변경 사항이 저장되지 않았습니다. 무시하시겠습니까?",
      placeholder_data_warning:
        "네트워크 문제: 데이터 새로고침에 실패했습니다.",
    },
    navigation: {
      clear_filters: "필터 지우기",
      no_filtered_results:
        "현재 필터로 %{name}를 찾을 수 없습니다.",
      partial_page_range_info: "%{offsetBegin}-%{offsetEnd} / %{offsetEnd} 이상",
      current_page: "페이지 %{page}",
      page: "%{page} 페이지로 이동",
      first: "첫 페이지로 이동",
      last: "마지막 페이지로 이동",
      previous: "이전 페이지로 이동",
      skip_nav: "콘텐츠로 건너뛰기",
    },
    sort: {
      sort_by: "%{field_lower_first} %{order} 정렬",
      ASC: "오름차순",
      DESC: "내림차순",
    },
    auth: {
      auth_check_error: "계속하려면 로그인하세요",
      email: "이메일",
    },
    notification: {
      i18n_error: "지정된 언어의 번역을 불러올 수 없습니다",
      not_authorized: "이 리소스에 접근할 권한이 없습니다.",
      application_update_available: "새 버전이 사용 가능합니다.",
      offline: "연결 없음. 데이터를 가져올 수 없습니다.",
    },
    validation: {
      unique: "고유해야 합니다",
    },
    saved_queries: {
      label: "저장된 쿼리",
      query_name: "쿼리 이름",
      new_label: "현재 쿼리 저장...",
      new_dialog_title: "현재 쿼리를 다음 이름으로 저장",
      remove_label: "저장된 쿼리 삭제",
      remove_label_with_name: "쿼리 \"%{name}\" 삭제",
      remove_dialog_title: "저장된 쿼리를 삭제할까요?",
      remove_message:
        "저장된 쿼리 목록에서 이 항목을 삭제하시겠습니까?",
      help: "목록을 필터링하고 이 쿼리를 저장해 나중에 사용하세요",
    },
    configurable: {
      customize: "사용자 지정",
      configureMode: "이 페이지 구성",
      inspector: {
        title: "검사기",
        content: "UI 요소 위에 마우스를 올려 구성합니다",
        reset: "설정 초기화",
        hideAll: "모두 숨기기",
        showAll: "모두 표시",
      },
      Datagrid: {
        title: "데이터그리드",
        unlabeled: "라벨 없는 열 #%{column}",
      },
      SimpleForm: {
        title: "폼",
        unlabeled: "라벨 없는 입력 #%{input}",
      },
      SimpleList: {
        title: "목록",
        primaryText: "기본 텍스트",
        secondaryText: "보조 텍스트",
        tertiaryText: "세 번째 텍스트",
      },
    },
  },
  "ra-supabase": {
    auth: {
      password_reset: "비밀번호 재설정 메일을 확인하세요.",
    },
  },
};
