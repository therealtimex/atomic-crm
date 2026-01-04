export const jaMessages = {
  crm: {
    nav: {
      dashboard: "ダッシュボード",
      contacts: "連絡先",
      companies: "会社",
      deals: "案件",
      tasks: "タスク",
    },
    view: {
      table: "テーブル",
      kanban: "カンバン",
    },
    action: {
      new_task: "新規タスク",
      new_deal: "新規案件",
    },
    filter: {
      active: "有効",
      active_filters: "適用中のフィルター",
      contact: "連絡先",
      company: "会社",
      deal: "案件",
      loading: "読み込み中...",
      my_tasks: "自分のタスク",
      assigned_to: "担当",
      archived: "アーカイブ済み",
      priority: "優先度",
      remove: "%{filter}フィルターを削除",
      search: "検索",
      status: "ステータス",
    },
    task: {
      column: {
        expand: "%{column}列を展開",
        collapse: "%{column}列を折りたたむ",
      },
      field: {
        task: "タスク",
        related_to: "関連先",
        due_date: "期限",
        priority: "優先度",
        status: "ステータス",
        assigned_to: "担当者",
        actions: "操作",
      },
      status: {
        todo: "未着手",
        in_progress: "進行中",
        blocked: "ブロック",
        done: "完了",
        cancelled: "キャンセル",
        other: "その他",
      },
      priority: {
        low: "低",
        medium: "中",
        high: "高",
        urgent: "緊急",
      },
      type: {
        none: "なし",
        email: "メール",
        demo: "デモ",
        lunch: "ランチ",
        meeting: "会議",
        follow_up: "フォローアップ",
        thank_you: "お礼",
        ship: "発送",
        call: "通話",
      },
    },
    note: {
      status: {
        cold: "コールド",
        warm: "ウォーム",
        hot: "ホット",
        in_contract: "契約中",
      },
    },
    deal: {
      field: {
        category: "カテゴリー",
      },
      stage: {
        opportunity: "機会",
        proposal_sent: "提案送付済み",
        in_negociation: "交渉中",
        won: "成約",
        lost: "失注",
        delayed: "延期",
      },
      category: {
        other: "その他",
        copywriting: "コピーライティング",
        print_project: "印刷プロジェクト",
        ui_design: "UIデザイン",
        website_design: "Webサイトデザイン",
      },
    },
    contact: {
      gender: {
        male: "彼/彼",
        female: "彼女/彼女",
        nonbinary: "彼ら/彼ら",
      },
    },
    company: {
      sector: {
        communication_services: "通信サービス",
        consumer_discretionary: "一般消費財・サービス",
        consumer_staples: "生活必需品",
        energy: "エネルギー",
        financials: "金融",
        health_care: "ヘルスケア",
        industrials: "産業",
        information_technology: "情報技術",
        materials: "素材",
        real_estate: "不動産",
        utilities: "公益事業",
      },
    },
  },
  ra: {
    action: {
      clear_array_input: "一覧をクリア",
      confirm: "確認",
      create_item: "%{item}を作成",
      remove_all_filters: "すべてのフィルターを解除",
      reset: "リセット",
      search_columns: "列を検索",
      select_all: "すべて選択",
      select_all_button: "すべて選択",
      select_row: "この行を選択",
      unselect: "選択解除",
      expand: "展開",
      close: "閉じる",
      open_menu: "メニューを開く",
      close_menu: "メニューを閉じる",
      update: "更新",
      move_up: "上へ移動",
      move_down: "下へ移動",
      open: "開く",
      toggle_theme: "ライト/ダークモードを切り替え",
      select_columns: "列",
      update_application: "アプリを再読み込み",
    },
    boolean: {
      null: " ",
    },
    page: {
      empty: "%{name}はまだありません。",
      invite: "追加しますか？",
      access_denied: "アクセス拒否",
      authentication_error: "認証エラー",
    },
    input: {
      password: {
        toggle_visible: "パスワードを非表示",
        toggle_hidden: "パスワードを表示",
      },
    },
    message: {
      access_denied: "このページにアクセスする権限がありません",
      authentication_error:
        "認証サーバーがエラーを返し、資格情報を確認できませんでした。",
      auth_error: "認証トークンの検証中にエラーが発生しました。",
      bulk_update_content:
        "%{name} %{recordRepresentation} を更新してよろしいですか？ |||| これらの %{smart_count} 件を更新してよろしいですか？",
      bulk_update_title:
        "%{name} %{recordRepresentation} を更新 |||| %{smart_count} 件の %{name} を更新",
      clear_array_input: "一覧をすべてクリアしてよろしいですか？",
      select_all_limit_reached:
        "選択できる要素が多すぎます。最初の %{max} 件のみ選択されました。",
      unsaved_changes:
        "変更が保存されていません。破棄してよろしいですか？",
      placeholder_data_warning:
        "ネットワークの問題: データの更新に失敗しました。",
    },
    navigation: {
      clear_filters: "フィルターをクリア",
      no_filtered_results:
        "現在のフィルターで %{name} が見つかりません。",
      partial_page_range_info: "%{offsetBegin}-%{offsetEnd} / %{offsetEnd} 以上",
      current_page: "ページ %{page}",
      page: "%{page} ページへ",
      first: "最初のページへ",
      last: "最後のページへ",
      previous: "前のページへ",
      skip_nav: "コンテンツへスキップ",
    },
    sort: {
      sort_by: "%{field_lower_first} を %{order} で並べ替え",
      ASC: "昇順",
      DESC: "降順",
    },
    auth: {
      auth_check_error: "続行するにはログインしてください",
      email: "メール",
    },
    notification: {
      i18n_error: "指定された言語の翻訳を読み込めません",
      logged_out: "セッションが終了しました。再ログインしてください。",
      not_authorized: "このリソースへのアクセス権限がありません。",
      application_update_available: "新しいバージョンがあります。",
      offline: "接続がありません。データを取得できませんでした。",
    },
    validation: {
      unique: "一意である必要があります",
    },
    saved_queries: {
      label: "保存済みクエリ",
      query_name: "クエリ名",
      new_label: "現在のクエリを保存...",
      new_dialog_title: "現在のクエリを次の名前で保存",
      remove_label: "保存済みクエリを削除",
      remove_label_with_name: "クエリ「%{name}」を削除",
      remove_dialog_title: "保存済みクエリを削除しますか？",
      remove_message:
        "保存済みクエリの一覧からこの項目を削除してよろしいですか？",
      help: "リストを絞り込み、このクエリを保存して後で使用できます",
    },
    configurable: {
      customize: "カスタマイズ",
      configureMode: "このページを設定",
      inspector: {
        title: "インスペクタ",
        content: "UI 要素にカーソルを合わせて設定します",
        reset: "設定をリセット",
        hideAll: "すべて非表示",
        showAll: "すべて表示",
      },
      Datagrid: {
        title: "データグリッド",
        unlabeled: "ラベルなし列 #%{column}",
      },
      SimpleForm: {
        title: "フォーム",
        unlabeled: "ラベルなし入力 #%{input}",
      },
      SimpleList: {
        title: "リスト",
        primaryText: "主要テキスト",
        secondaryText: "副次テキスト",
        tertiaryText: "第三テキスト",
      },
    },
  },
  "ra-supabase": {
    auth: {
      password_reset: "パスワード再設定のメールを確認してください。",
    },
  },
};
