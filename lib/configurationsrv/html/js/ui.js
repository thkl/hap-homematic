export class Label {
  constructor (label) {
    this.label = $('<div>')
    if (label) {
      this.label.append(label)
    }
  }

  setStyle (style) {
    this.label.attr('style', style)
  }

  setLabel (label) {
    this.label.empty()
    this.label.append(label)
  }

  render () {
    return this.label
  }
}

export class Spinner {
  constructor () {
    this.spinner = $('<div>').attr('role', 'status')
  }

  setActive (active) {
    if (active === true) {
      this.spinner.addClass('spinner-border')
    } else {
      this.spinner.removeClass('spinner-border')
    }
  }

  render () {
    return this.spinner
  }
}

export class Button {
  constructor (type, title, onClick, enabled = true) {
    this.isActive = enabled
    this.button = $('<button>')
    this.button.attr('type', 'button')
    this.button.addClass('btn')

    this.button.addClass('btn-' + type)
    if (this.isActive) {
      this.button.addClass('active')
    } else {
      this.button.attr('disabled', 'disabled')
    }
    this.button.on('click', (e) => {
      onClick(e, e.target)
    })
    this.button.append(title)
  }

  setStyle (style) {
    this.button.attr('style', style)
  }

  setActive (isActive) {
    this.isActive = isActive
    if (this.isActive) {
      this.button.removeAttr('disabled')
      this.button.addClass('active')
    } else {
      this.button.removeClass('active')
      this.button.attr('disabled', 'disabled')
    }
  }

  render () {
    return this.button
  }
}

export class Input {
  constructor (id, value, onChange) {
    this.input = $('<input>').attr('id', id)
    if (onChange) {
      this.input.bind('change', (e) => {
        onChange(e, e.target)
      })
    }
    this.input.addClass('form-control')
    this.input.val(value)
  }

  setStyle (style) {
    this.style = style
    if (this.container) {
      this.container.attr('style', this.style)
    }
  }

  setLabel (label) {
    this.label = $('<label>').attr('for', this.id)
    this.label.append(label)
  }

  setGroupLabel (label) {
    this.label = $('<div>').addClass('input-group-prepend')
    this.label.attr('style', 'width:100%')
    let span = $('<span>').addClass('input-group-text').append(label)
    this.label.append(span)
    this.isGrouped = true
  }

  setEnabled (enabled) {
    if (enabled) {
      this.input.removeAttr('disabled', 'disabled')
    } else {
      this.input.attr('disabled', 'disabled')
    }
  }

  setValue (newValue) {
    this.input.val(newValue)
  }

  getValue () {
    return this.input.val()
  }

  render () {
    if (this.label) {
      if (this.isGrouped === true) {
        this.container = $('<div>').addClass('input-group')
        this.container.append(this.label)
        this.label.append(this.input)
      } else {
        this.container = $('<div>').append(this.label).append(this.input)
      }
      if (this.style) {
        this.container.attr('style', this.style)
      }
      return this.container
    } else {
      return this.input
    }
  }
}

export class CheckBox extends Input {
  constructor (id, value, onChange) {
    super(id, 'true', onChange)
    this.input.attr('type', 'checkbox')
    this.setValue(value)
  }

  setLabel (label) {
    this.label = $('<label>').attr('for', this.id)
    this.label.addClass('form-check-label')
    this.input.removeClass('form-control')
    this.input.addClass('form-check-input')
    this.label.append(label)
  }

  setValue (newValue) {
    if (newValue === true) {
      this.input.attr('checked', 'checked')
    } else {
      this.input.removeAttr('checked')
    }
  }

  getValue () {
    return (this.input.attr('checked') === 'checked')
  }

  render () {
    if (this.label) {
      let result = $('<div>').append(this.input).append(this.label)
      result.addClass('form-check')
      return result
    } else {
      return this.input
    }
  }
}

export class ButtonInput {
  constructor (id, value, title, onChange, onButton) {
    this.container = $('<div>').addClass('input-group mb-3')

    this.input = $('<input>').attr('id', id)
    if (onChange) {
      this.input.bind('change', (e) => {
        onChange(e, e.target)
      })
    }
    this.input.addClass('form-control')
    this.input.val(value)
    this.container.append(this.input)

    let inputGroup = $('<div>').addClass('input-group-prepend')
    let button = $('<button>').addClass('btn btn-outline-secondary').attr('type', 'button').append(title)
    button.bind('click', (e) => {
      onButton(e, e.target)
    })
    inputGroup.append(button)
    this.container.append(inputGroup)
  }

  setLabel (label) {
    this.label = $('<label>').attr('for', this.id)
    this.label.append(label)
  }

  setValue (newValue) {
    this.input.val(newValue)
  }

  render () {
    if (this.label) {
      let result = $('<div>').append(this.label).append(this.container)
      return result
    } else {
      return this.container
    }
  }
}

export class Dropdown {
  constructor (id, title, onClick) {
    this.id = id
    this.items = []

    this.dropDown = $('<div>').addClass('btn-group').attr('style', '    width: 100%;')
    this.button = $('<button>').attr('class', 'btn btn-secondary dropdown-toggle').attr('type', 'button')
    this.button.attr('id', 'dropdownMenuButton_' + this.id)
    this.button.attr('data-toggle', 'dropdown')
    this.button.attr('aria-expanded', false)
    this.button.append(title)
    this.dropDown.append(this.button)
    this.dropDownItems = $('<div>').addClass('dropdown-menu').attr('aria-labelledby', 'dropdownMenuButton_' + this.id)
    this.dropDown.append(this.dropDownItems)
    this.button.bind('click', (e) => {
      onClick(e)
    })
  }
  setTitle (newTitle) {
    this.button.empty()
    this.button.append(newTitle)
  }
  addItem (item) {
    let self = this
    let mItem = $('<button>').addClass('dropdown-item').attr('type', 'button').attr('data-value', item.value).append(item.title)
    mItem.attr('data-title', item.title)
    mItem.bind('click', (e) => {
      self.setTitle(e.target.getAttribute('data-title'))
      if (item.onClick) {
        item.onClick(e, e.target.getAttribute('data-value'))
      }
    })
    this.dropDownItems.append(mItem)
  }

  render () {
    return this.dropDown
  }
}

export class Pagination {
  constructor (parent) {
    this.parent = parent
    this.pages = []
    this.maxPages = 8
    this.curStartPage = 0
  }

  addPage (id, isActive, title, start, onClick) {
    this.pages.push({id: id, isActive: isActive, title: title, start: start, onClick: onClick})
  }

  setParent (parent) {
    this.parent = parent
  }

  setActivePage (pageNum) {
    this.pages.map(page => {
      page.isActive = (page.id === pageNum)
    })
    this.render()
  }

  reset () {
    this.pages = []
    this.curStartPage = 0
  }

  renderPage (num, title, active, enabled, callback) {
    let oLi = $('<li>').addClass('page-item')
    if (enabled) {
      oLi.attr('disabled', 'disabled')
    }

    if (active) {
      oLi.addClass('active')
    }
    let oAnc = $('<a>').addClass('page-link')
    oAnc.on('click', function (e) {
      if (callback) {
        callback(e, num)
      }
    })
    oAnc.attr('style', 'cursor:pointer')
    oAnc.append(title)
    oLi.append(oAnc)
    return oLi
  }

  render () {
    let self = this
    this.parent.empty()
    let canvas = this.parent
    if (!canvas.is('ul')) {
      canvas = $('<ul>')
      canvas.addClass('pagination')
      this.parent.append(canvas)
    }

    let lastPage = this.pages.length

    if (this.pages.length > this.maxPages) {
      let active = (this.curStartPage !== 0)
      let opage = this.renderPage(-1, (this.prevTitle || 'Previous'), false, active, (e, num) => {
        if (self.curStartPage > 0) {
          self.curStartPage = self.curStartPage - 1
        }
        self.render()
      })
      canvas.append(opage)
      lastPage = this.curStartPage + this.maxPages
    }

    for (var i = this.curStartPage; i < lastPage; i++) {
      let page = this.pages[i]
      if (page) {
        let opage = this.renderPage(page.id, page.title, page.isActive, true, (e, num) => {
          page.onClick(e, page)
        })
        canvas.append(opage)
      }
    }

    if (this.pages.length > this.maxPages) {
      let active = (this.curStartPage !== 0)
      let opage = this.renderPage(-1, (this.NextTitle || 'Next'), false, active, (e, num) => {
        if (self.curStartPage < (self.pages.length - self.maxPages)) {
          self.curStartPage = self.curStartPage + 1
        }
        self.render()
      })
      canvas.append(opage)
    }
  }
}

export class Dialog {
  constructor (settings) {
    this.dialogId = settings.dialogId
    this.dialog = $('<div>').attr('class', 'modal fade').attr('tabindex', '-1').attr('role', 'dialog').attr('id', settings.dialogId)
    let dDocument = $('<div>').attr('class', 'modal-dialog').attr('role', 'document')

    if (settings.dialogClass) {
      dDocument.addClass(settings.dialogClass)
    }

    if (settings.size) {
      dDocument.addClass(settings.size)
    } else {
      dDocument.addClass('modal-lg')
    }

    if (settings.scrollable) {
      dDocument.addClass('modal-dialog-scrollable')
    }

    this.dialog.append(dDocument)

    let dContent = $('<div>').addClass('modal-content')
    dDocument.append(dContent)

    let dHeader = $('<div>').addClass('modal-header')
    dContent.append(dHeader)

    if (settings.title) {
      let dTitle = $('<h5>').addClass('modal-title').attr('id', settings.dialogId + '_title')
      dTitle.append(settings.title)
      dHeader.append(dTitle)
    }

    let dCloseButton = $('<button>').attr('type', 'button').attr('class', 'close').attr('data-dismiss', 'modal')
    if (settings.labelClose) {
      dCloseButton.attr('aria-label', settings.labelClose)
    } else {
      dCloseButton.attr('aria-label', 'Close')
    }

    dCloseButton.append($('<span>').attr('aria-hidden', 'true').append('&times;'))
    dHeader.append(dCloseButton)

    this.body = $('<div>').addClass('modal-body').attr('id', settings.dialogId + '_content')
    dContent.append(this.body)

    let dFooter = $('<div>').addClass('modal-footer')
    dContent.append(dFooter)

    if (settings.buttons) {
      settings.buttons.map(button => {
        if (button) {
          dFooter.append(button.render())
        }
      })
    }
  }

  setBody (item) {
    let self = this
    this.body.empty()
    if (typeof item === 'object') {
      if (Array.isArray(item)) {
        item.map(iitem => {
          self.body.append(iitem)
        })
      } else {
        this.body.append(item)
      }
    } else {
      this.body.append(item)
    }
  }

  open () {
    let self = this
    $('body').append(this.dialog)

    $('#' + this.dialogId)
      .on('hidden.bs.modal', function (e) {
        setTimeout(function () {
          self.dialog.remove()
        }, 50)
      })

    this.dialog.modal()
  }

  close () {
    this.dialog.modal('hide')
  }
}

export class GridRow {
  constructor (id, settings = {}) {
    this.id = id
    this.cells = []
    this.settings = settings
  }

  addCell (szData, content, clazz) {
    this.cells.push({sz: szData, content: content, clazz: clazz})
  }

  setClasses (classNames) {
    this.cssClazzName = classNames
  }

  render () {
    let result = $('<div>').addClass('row')
    if ((this.settings) && (this.settings.rowStyle)) {
      result.attr('style', this.settings.rowStyle)
    }
    if (this.cssClazzName) {
      this.cssClazzName.split(' ').map(clazz => {
        result.addClass(clazz)
      })
    }
    this.cells.forEach(cell => {
      let oCell = $('<div>')
      if (cell.sz) {
        oCell.addClass('col-sm-' + (cell.sz.sm || 12))
        oCell.addClass('col-md-' + (cell.sz.md || 6))
        oCell.addClass('col-lg-' + (cell.sz.lg || 3))
        oCell.addClass('col-xl-' + (cell.sz.xl || cell.sz.lg || 3))
      } else {
        oCell.addClass('col-auto')
      }
      oCell.append(cell.content)
      result.append(oCell)
    })
    return result
  }
}

export class Grid {
  constructor (id, settings = {}) {
    this.id = id
    this.rows = []
    this.settings = settings
    this.canvas = $('<div>')
  }

  resetRows () {
    this.rows = []
    this.canvas.empty()
  }

  addRow (id, rowSettings) {
    if (rowSettings === undefined) {
      rowSettings = this.settings
    }
    let row = new GridRow(this.id + '_' + id, rowSettings)
    this.rows.push(row)
    return row
  }

  render () {
    let self = this
    this.rows.map(row => {
      self.canvas.append(row.render())
    })
    return this.canvas
  }
}

export class DatabaseGrid extends Grid {
  constructor (id, dataset, settings = {}) {
    super(id, settings)
    this.dataset = dataset
    this.curRecord = 0
    this.maxRecords = 10
    this.pagination = new Pagination()
    this.pagination.maxPages = settings.maxPages || 8
    this.gridContainer = $('<div>')
  }

  setColumns (colums) {
    this.columns = colums
  }

  setTitleLabels (titleLabels) {
    this.titleLabels = titleLabels
  }

  addSearchBar (label, clearButtonTitle, filterCallback) {
    let self = this
    this.searchInput = new ButtonInput(this.id + '_search', '', clearButtonTitle, (e, input) => {
      self.filter = input.value
      self.pagination.reset()
      self.renderPagination(0)
      self.updateBody()
    }, (e, btn) => {
      self.searchInput.setValue('')
      self.filter = ''
      self.pagination.reset()
      self.renderPagination(0)
      self.updateBody()
    })

    if (label) {
      this.searchInput.setLabel(label)
    }
    this.filterCallback = filterCallback
  }

  getDataset () {
    let self = this
    if (this.dataset === undefined) {
      return []
    }
    if (this.filter !== undefined) {
      return this.dataset.filter((element) => {
        return self.filterCallback(element, self.filter)
      })
    } else {
      return this.dataset
    }
  }

  setDataset (dataset) {
    this.dataset = dataset
    this.curRecord = 0
    this.maxRecords = 10
    this.updateBody()
  }

  setRenderer (callback) {
    this.renderder = callback
  }

  setMaxDataRecords (max) {
    this.maxRecords = max
  }

  prepare () {
    if (this.searchInput) {
      this.gridContainer.append(this.searchInput.render())
    }
    if (!this.footer) {
      this.footer = $('<div>')
    }
    let divPr = $('<div>').addClass('row')
    divPr.attr('style', 'margin-top:15px')
    this.footer.append(divPr)
    // only add a pager if there are more records than maxRecords
    let divPc = $('<div>').addClass('col-auto')
    divPr.append(divPc)
    this.pagination.setParent(divPc)
    this.renderPagination(0)
    this.canvas.attr('style', 'margin:15px')
  }

  updateBody () {
    // loop thru the first Datasets
    let self = this
    this.resetRows()
    let dataset = this.getDataset()
    let max = this.curRecord + this.maxRecords
    if (max > dataset.length) {
      max = dataset.length
    }
    var i = 0
    var j = 0
    // add the titleRow
    let row = super.addRow()
    row.setClasses('dbgridtitle')
    this.columns.map(column => {
      row.addCell(column.sz, self.titleLabels[j] || '')
      j = j + 1
    })

    for (let index = this.curRecord; index < max; index++) {
      const element = dataset[index]
      if (this.renderder) {
        let row = super.addRow()
        if (i % 2) {
          row.setClasses('dbgridline odd')
        } else {
          row.setClasses('dbgridline')
        }
        let renderedElements = this.renderder(row, element)
        j = 0
        this.columns.map(column => {
          row.addCell(column.sz, renderedElements[j] || '')
          j = j + 1
        })
        i = i + 1
      }
    }
    super.render()
  }

  render () {
    this.prepare()
    this.updateBody()
    this.gridContainer.append(this.canvas)
    this.gridContainer.append(this.footer)
    return this.gridContainer
  }

  renderPagination () {
    var cnt = 0
    var tcnt = 1
    let self = this
    if (this.getDataset().length > this.maxRecords) {
    // ((cnt >= start) && (cnt < start + count))
      while (cnt < this.getDataset().length) {
        this.pagination.addPage(tcnt - 1, false, tcnt, cnt, (e, page) => {
          self.curRecord = page.start
          self.updateBody()
          self.pagination.setActivePage(page.id)
        })
        cnt = cnt + this.maxRecords
        tcnt = tcnt + 1
      }
      this.pagination.setActivePage(0)
    } else {
      this.pagination.setActivePage(0)
    }
  }
}
