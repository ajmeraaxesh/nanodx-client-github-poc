//import * as Excel from 'exceljs/dist/es5/exceljs.browser'
import * as Excel from 'exceljs/dist/exceljs.min.js'

export const getExcelColumnHeaders = columns => {
  let columnNames = columns
    .filter(column => column.id !== 'More')
    .map(column => column.Header)
  return columnNames
}

export const getRowDataUsingAccessor = (columns, rows) => {
  let rowAccessor = columns
    .filter(column => column.id !== 'More')
    .map(column =>
      typeof column.accessor === 'function' ? column.id : column.accessor,
    )

  console.log('Row Accessor:: ', rowAccessor)

  return rows.map(row => {
    let rowData = rowAccessor.map(cell => row.values[cell])
    return rowData
  })
}

export const getRowDataUsingOriginalValues = (
  allColumnNames,
  rows,
  accessorColumns = null,
) => {
  return rows.map(row => {
    let rowData = allColumnNames.map(column => {
      //console.log('getRowDataUsingOriginalValues:: ', row)

      if (accessorColumns && accessorColumns.indexOf(column) > -1) {
        return row.values[column]
      }
      return row.original[column] || ''
    })
    return rowData
  })
}

const toDataURL = url =>
  fetch(url)
    .then(response => response.blob())
    .then(
      blob =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        }),
    )

// const fileToBase64 = (filename, filepath) => {
//     return new Promise((resolve) => {
//         var file = new File([filename], filepath)
//         var reader = new FileReader()
//         // Read file content on file loaded event
//         reader.onload = function (event) {
//             resolve(event.target.result)
//         }

//         // Convert data to base64
//         reader.readAsDataURL(file)
//     })
// }

export const FileDownload = async (rows, columns, headerInfo) => {
  // console.log(
  //     'onFileDownload:: rows:: ',
  //     rows,
  //     ' columns:: ',
  //     columns,
  //     ' header:: ',
  //     headerInfo
  // )

  let workbook = new Excel.Workbook()

  // fileToBase64('nanodx-logo.png', '../assets/images/nanodx-logo.png').then(
  //     (result) => {
  //         //console.log(result);
  //         console.log('Image:: Base64:: ', result)
  //     }
  // )

  // const nanoDxImageId = workbook.addImage({
  //     filename: nanodx,
  //     extension: 'png',
  // })

  const base64Result = await toDataURL(
    'https://nanodiagnostics.com/wp-content/uploads/2020/04/nano-dx-203x70-1.png',
  )

  const imageId = workbook.addImage({
    base64: base64Result,
    extension: 'png',
  })

  let worksheet = workbook.addWorksheet(`${headerInfo.sheetname.toLowerCase()}`)
  worksheet.addImage(imageId, 'A1:B4')
  worksheet.addRow([]).commit()
  worksheet.addRow([]).commit()
  worksheet.addRow([]).commit()
  worksheet.addRow([]).commit()

  //worksheet.addImage(nanoDxImageId, 'A1:B4')

  worksheet.addRow([`${headerInfo.header.toUpperCase()}`]).commit()
  worksheet.getRow(5).font = {
    size: 16,
    bold: true,
  }
  worksheet.addRow([]).commit()

  let columnNames = columns

  //console.log('Excel Columns: ', columnNames)
  worksheet.addRow(columnNames).commit()
  worksheet.getRow(7).font = {bold: true}

  rows.forEach(row => {
    worksheet.addRow(row).commit()
  })

  const buf = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buf])
  let url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  document.body.appendChild(a)
  a.style = 'display: none'
  a.href = url
  a.download = `${headerInfo.filename}.xlsx`
  a.click()
  window.URL.revokeObjectURL(url)
}

export default FileDownload
