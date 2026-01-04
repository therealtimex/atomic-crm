export const esMessages = {
  crm: {
    nav: {
      dashboard: "Tablero",
      contacts: "Contactos",
      companies: "Empresas",
      deals: "Negocios",
      tasks: "Tareas",
    },
    view: {
      table: "Tabla",
      kanban: "Kanban",
    },
    action: {
      new_task: "Nueva tarea",
      new_deal: "Nuevo negocio",
    },
    filter: {
      active: "Activo",
      active_filters: "Filtros activos",
      contact: "Contacto",
      company: "Empresa",
      deal: "Negocio",
      loading: "Cargando...",
      my_tasks: "Mis tareas",
      assigned_to: "Asignado a",
      archived: "Archivado",
      priority: "Prioridad",
      remove: "Eliminar filtro %{filter}",
      search: "Buscar",
      status: "Estado",
    },
    task: {
      column: {
        expand: "Expandir la columna %{column}",
        collapse: "Contraer la columna %{column}",
      },
      field: {
        task: "Tarea",
        related_to: "Relacionado con",
        due_date: "Fecha de vencimiento",
        priority: "Prioridad",
        status: "Estado",
        assigned_to: "Asignado a",
        actions: "Acciones",
      },
      status: {
        todo: "Por hacer",
        in_progress: "En progreso",
        blocked: "Bloqueado",
        done: "Hecho",
        cancelled: "Cancelado",
        other: "Otro",
      },
      priority: {
        low: "Baja",
        medium: "Media",
        high: "Alta",
        urgent: "Urgente",
      },
      type: {
        none: "Ninguno",
        email: "Correo",
        demo: "Demo",
        lunch: "Almuerzo",
        meeting: "Reunión",
        follow_up: "Seguimiento",
        thank_you: "Agradecimiento",
        ship: "Enviar",
        call: "Llamada",
      },
    },
    note: {
      status: {
        cold: "Frío",
        warm: "Cálido",
        hot: "Caliente",
        in_contract: "En contrato",
      },
    },
    deal: {
      field: {
        category: "Categoría",
      },
      stage: {
        opportunity: "Oportunidad",
        proposal_sent: "Propuesta enviada",
        in_negociation: "En negociación",
        won: "Ganado",
        lost: "Perdido",
        delayed: "Aplazado",
      },
      category: {
        other: "Otro",
        copywriting: "Redacción",
        print_project: "Proyecto de impresión",
        ui_design: "Diseño UI",
        website_design: "Diseño de sitios web",
      },
    },
    contact: {
      gender: {
        male: "Él/Él",
        female: "Ella/Ella",
        nonbinary: "Elle/Elle",
      },
    },
    company: {
      sector: {
        communication_services: "Servicios de comunicación",
        consumer_discretionary: "Consumo discrecional",
        consumer_staples: "Consumo básico",
        energy: "Energía",
        financials: "Finanzas",
        health_care: "Salud",
        industrials: "Industriales",
        information_technology: "Tecnologías de la información",
        materials: "Materiales",
        real_estate: "Bienes raíces",
        utilities: "Servicios públicos",
      },
    },
  },
  ra: {
    action: {
      clear_array_input: "Borrar la lista",
      clear_input_value: "Borrar valor",
      clone: "Clonar",
      confirm: "Confirmar",
      create_item: "Crear %{item}",
      export: "Exportar",
      remove_all_filters: "Eliminar todos los filtros",
      reset: "Restablecer",
      search: "Buscar",
      search_columns: "Buscar columnas",
      select_all: "Seleccionar todo",
      select_all_button: "Seleccionar todo",
      select_row: "Seleccionar esta fila",
      unselect: "Deseleccionar",
      expand: "Expandir",
      close: "Cerrar",
      open_menu: "Abrir menú",
      close_menu: "Cerrar menú",
      update: "Actualizar",
      move_up: "Mover arriba",
      move_down: "Mover abajo",
      open: "Abrir",
      toggle_theme: "Alternar modo claro/oscuro",
      select_columns: "Columnas",
      update_application: "Recargar aplicación",
    },
    boolean: {
      null: " ",
    },
    page: {
      error: "Algo salió mal",
      empty: "Aún no hay %{name}.",
      invite: "¿Quieres agregar uno?",
      access_denied: "Acceso denegado",
      authentication_error: "Error de autenticación",
    },
    input: {
      password: {
        toggle_visible: "Ocultar contraseña",
        toggle_hidden: "Mostrar contraseña",
      },
    },
    message: {
      access_denied:
        "No tienes permisos para acceder a esta página",
      authentication_error:
        "El servidor de autenticación devolvió un error y no se pudieron verificar tus credenciales.",
      auth_error:
        "Ocurrió un error al validar el token de autenticación.",
      bulk_update_content:
        "¿Seguro que deseas actualizar %{name} %{recordRepresentation}? |||| ¿Seguro que deseas actualizar estos %{smart_count} elementos?",
      bulk_update_title:
        "Actualizar %{name} %{recordRepresentation} |||| Actualizar %{smart_count} %{name}",
      clear_array_input:
        "¿Seguro que deseas borrar toda la lista?",
      details: "Detalles",
      error:
        "Se produjo un error del cliente y no se pudo completar tu solicitud.",
      select_all_limit_reached:
        "Hay demasiados elementos para seleccionarlos todos. Solo se seleccionaron los primeros %{max} elementos.",
      unsaved_changes:
        "Algunos cambios no se guardaron. ¿Seguro que quieres ignorarlos?",
      placeholder_data_warning:
        "Problema de red: la actualización de datos falló.",
    },
    navigation: {
      clear_filters: "Limpiar filtros",
      no_filtered_results:
        "No se encontraron %{name} con los filtros actuales.",
      partial_page_range_info:
        "%{offsetBegin}-%{offsetEnd} de más de %{offsetEnd}",
      current_page: "Página %{page}",
      page: "Ir a la página %{page}",
      first: "Ir a la primera página",
      last: "Ir a la última página",
      previous: "Ir a la página anterior",
      page_rows_per_page: "Filas por página:",
      skip_nav: "Saltar al contenido",
    },
    sort: {
      sort_by: "Ordenar por %{field_lower_first} %{order}",
      ASC: "ascendente",
      DESC: "descendente",
    },
    auth: {
      auth_check_error: "Por favor inicia sesión para continuar",
      user_menu: "Perfil",
      email: "Correo electrónico",
    },
    notification: {
      data_provider_error:
        "Error del dataProvider. Revisa la consola para más detalles.",
      i18n_error:
        "No se pueden cargar las traducciones para el idioma especificado",
      logged_out:
        "Tu sesión ha finalizado, por favor vuelve a iniciar sesión.",
      not_authorized:
        "No estás autorizado para acceder a este recurso.",
      application_update_available: "Hay una nueva versión disponible.",
      offline: "Sin conectividad. No se pudieron obtener los datos.",
    },
    validation: {
      unique: "Debe ser único",
    },
    saved_queries: {
      label: "Consultas guardadas",
      query_name: "Nombre de la consulta",
      new_label: "Guardar consulta actual...",
      new_dialog_title: "Guardar consulta actual como",
      remove_label: "Eliminar consulta guardada",
      remove_label_with_name: "Eliminar consulta \"%{name}\"",
      remove_dialog_title: "¿Eliminar consulta guardada?",
      remove_message:
        "¿Seguro que quieres eliminar ese elemento de tu lista de consultas guardadas?",
      help: "Filtra la lista y guarda esta consulta para más tarde",
    },
    configurable: {
      customize: "Personalizar",
      configureMode: "Configurar esta página",
      inspector: {
        title: "Inspector",
        content:
          "Pasa el cursor sobre los elementos de la interfaz para configurarlos",
        reset: "Restablecer configuración",
        hideAll: "Ocultar todo",
        showAll: "Mostrar todo",
      },
      Datagrid: {
        title: "Tabla",
        unlabeled: "Columna sin etiqueta #%{column}",
      },
      SimpleForm: {
        title: "Formulario",
        unlabeled: "Campo sin etiqueta #%{input}",
      },
      SimpleList: {
        title: "Lista",
        primaryText: "Texto principal",
        secondaryText: "Texto secundario",
        tertiaryText: "Texto terciario",
      },
    },
  },
  "ra-supabase": {
    auth: {
      password_reset:
        "Revisa tu correo para el mensaje de restablecimiento de contraseña.",
    },
  },
};
