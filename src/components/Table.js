import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  Fragment,
  forwardRef,
} from 'react'

import {
  useTable,
  useSortBy,
  useGlobalFilter,
  useAsyncDebounce,
  useBlockLayout,
  useRowSelect,
} from 'react-table'
// A great library for fuzzy filtering/sorting items
import {matchSorter} from 'match-sorter'
// import Link from 'next/link'

import {
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentDownloadIcon,
} from '@heroicons/react/solid'

import {PlusIcon, SearchIcon} from '@heroicons/react/outline'
import {TABLEDEFAULTHEIGHT} from '@lib/constants'

import {FixedSizeList} from 'react-window'

const TableAndFilterContainer = ({children, totalWidth}) => (
  <div className="mt-2 flex flex-col mx-auto" style={{maxWidth: totalWidth}}>
    <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          {children}
        </div>
      </div>
    </div>
  </div>
)

const TableContainer = ({reactTableProps, children}) => (
  <div className="min-w-full divide-y divide-gray-200" {...reactTableProps}>
    {/* This divide-y is for adding separator of table header and table body
                which is represented as children below
              */}

    {children}
  </div>
)

// const Tr = ({ reactTableProps, children }) => {
//     return (
//         <div
//             className="flex flex-row justify-evenly items-start"
//             {...reactTableProps}
//         >
//             {children}
//         </div>
//     )
// }

const TableHeader = ({
  reactTableHeaderGroups,
  tableHeight,
  rowHeight,
  data,
}) => (
  <div>
    {/* Start of thead */}
    <div className="bg-gray-50">
      {reactTableHeaderGroups.map((headerGroup, index) => (
        <div key={index}>
          {/* Start of tr */}
          <div
            {...headerGroup.getHeaderGroupProps()}
            className={
              data.length > Math.round(tableHeight / rowHeight)
                ? 'overflow-y-scroll'
                : ''
            }
          >
            {headerGroup.headers.map((columnHeader, index) => (
              <Fragment key={index}>
                {/* start of a single column header */}
                <div
                  className=" flex flex-row justify-start
                              px-4 py-2 bg-gray-50
                              text-xs leading-4 font-tradegothic-bold
                              text-brand-dark-gray
                              uppercase tracking-wider"
                  {...columnHeader.getHeaderProps(
                    columnHeader.getSortByToggleProps(),
                  )}
                >
                  {columnHeader.render('Header')}
                  {columnHeader.isSorted ? (
                    columnHeader.isSortedDesc ? (
                      <ArrowDownIcon className="inline-flex h-3 pl-1" />
                    ) : (
                      <ArrowUpIcon className="inline-flex h-3 pl-1" />
                    )
                  ) : (
                    ''
                  )}
                </div>
                {/* end of a single column header */}
              </Fragment>
            ))}
          </div>
          {/* End of tr */}
        </div>
      ))}
    </div>
    {/* End of thead */}
  </div>
)

function fuzzyTextFilterFn(rows, id, filterValue) {
  return matchSorter(rows, filterValue, {keys: [row => row.values[id]]})
}

// Let the table remove the filter if the string is empty
fuzzyTextFilterFn.autoRemove = val => !val

const Search = ({
  preGlobalFilteredRows = [],
  globalFilter,
  setGlobalFilter,
  searchPlaceHolderText,
}) => {
  const count = preGlobalFilteredRows.length
  const [value, setValue] = useState(globalFilter)
  const onChange = useAsyncDebounce(filter => {
    setGlobalFilter(filter || undefined)
  }, 200)

  return (
    <div className="flex ">
      <div className="relative flex-grow focus-within:z-10">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>

        <input
          id="search_table"
          className="hidden md:block w-full max-w-lg  py-2 pl-10 border border-gray-200
                               rounded-md shadow-sm  transition ease-in-out duration-150 "
          placeholder={searchPlaceHolderText || `Search ${count} records...`}
          value={value || ''}
          onChange={e => {
            setValue(e.target.value)
            onChange(e.target.value)
          }}
        />

        <input
          id="search_table"
          className="block md:hidden w-full
                                 py-2 pl-10 border border-gray-200 text-sm leading-5 rounded-md shadow-sm
                               transition ease-in-out duration-150  "
          placeholder={`Search ${count} records...`}
          value={value || ''}
          onChange={e => {
            setValue(e.target.value)
            onChange(e.target.value)
          }}
        />
      </div>
    </div>
  )
}

const Button = ({children, onClick}) => (
  <span className="">
    <button
      type="button"
      className="btn inline-flex items-center py-2 px-2
                        text-sm leading-5 font-medium rounded-md
                        transition duration-150 ease-in-out"
      onClick={() => onClick()}
    >
      {children}
    </button>
  </span>
)

const SearchAndOtherButtons = ({
  onAddClick,
  onNoticeClick,
  onDocumentDownloadClick,
  rows,
  columns,
  selectedRows,
  noticeType,
  ...searchProps
}) => (
  <div className=" py-4 bg-gray-50 border-b border-gray-200 grid grid-cols-1 lg:grid-cols-6 ">
    <div className="lg:col-span-5">
      <div className="flex flex-col space-y-2 lg:flex-row lg:space-x-2 lg:items-center">
        {onAddClick && (
          <div className="mx-6">
            <Button onClick={onAddClick}>
              <PlusIcon className="h-6 w-6" />
            </Button>
          </div>
        )}
        {onNoticeClick && (
          <div className="mx-6 mt-2">
            <Button onClick={() => onNoticeClick(selectedRows)}>
              {`Mark as ${noticeType === 'read' ? 'unread' : 'read'}`}
            </Button>
          </div>
        )}
        <div className="flex-1 px-6">
          <Search {...searchProps} />
        </div>
      </div>
    </div>

    <div className="flex flex-row justify-center space-x-2 items-center mx-6 lg:mx-0 mt-4 lg:mt-0">
      {onDocumentDownloadClick && (
        <Button
          onClick={() => {
            onDocumentDownloadClick(rows, columns)
          }}
        >
          <DocumentDownloadIcon className="h-6 w-6" />
        </Button>
      )}
      {/* FIXME: Enable these buttons
                    when print and email buttons are available
                 <Button />
                <Button /> */}
    </div>
  </div>
)

const IndeterminateCheckbox = forwardRef(function CheckBox(
  {indeterminate, ...rest},
  ref,
) {
  const defaultRef = useRef()
  const resolvedRef = ref || defaultRef

  useEffect(() => {
    resolvedRef.current.indeterminate = indeterminate
  }, [resolvedRef, indeterminate])

  return (
    <>
      <input type="checkbox" ref={resolvedRef} {...rest} />
    </>
  )
})

const RenderRow = ({index, style, data}) => {
  const {onRowClick, prepareRow, rows} = data
  const row = rows[index]
  prepareRow(row)
  const rowBackground = index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
  const rowDetailColumn = row.cells.filter(cell => cell.column.id === 'More')[0]
  const rowDetailValue = rowDetailColumn ? rowDetailColumn.value : ''
  return (
    <div
      key={row.id}
      // role="button"
      {...row.getRowProps({style})}
      className={`${rowBackground}
                      ${rowDetailValue && onRowClick ? 'cursor-pointer' : ''}
                      flex flex-row items-center justify-start focus:outline-none
                    `}
      onClick={() =>
        rowDetailValue && onRowClick ? onRowClick(rowDetailValue) : {}
      }
      tabIndex={index}
    >
      {row.cells.map((cell, index) => (
        <div
          {...cell.getCellProps()}
          key={`${row.id}${index}`}
          className={`
                          px-4 py-2 whitespace-no-wrap
                          text-xs leading-5 text-brand-dark-blue`}
        >
          {cell.render('Cell')}
        </div>
      ))}
    </div>
  )
}

const Table = ({
  columns,
  data,
  initialState,
  rowHeight = 40,
  onRowClick = null,
  onAddClick = null,
  onNoticeClick = null,
  onDocumentDownloadClick = null,
  tableHeight = TABLEDEFAULTHEIGHT,
  searchPlaceHolderText = '',
  tableType = 'table',
  noticeType = null,
}) => {
  const filterTypes = useMemo(
    () => ({
      // Add a new fuzzyTextFilterFn filter type.
      fuzzyText: fuzzyTextFilterFn,
      // Or, override the default text filter to use
      // "startWith"
      text: (rows, id, filterValue) =>
        rows.filter(row => {
          const rowValue = row.values[id]
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase())
            : true
        }),
    }),
    [],
  )

  const defaultColumn = useMemo(
    () => ({
      Filter: null,
      width: 200,
    }),
    [],
  )

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
    preGlobalFilteredRows,
    setGlobalFilter,
    totalColumnsWidth,
    selectedFlatRows,
  } = useTable(
    {
      columns,
      data,
      initialState,
      defaultColumn,
      filterTypes,
    },
    useGlobalFilter,
    useSortBy,
    useBlockLayout,
    useRowSelect,

    hooks => {
      if (tableType === 'notices') {
        hooks.visibleColumns.push(columns => [
          // Let's make a column for selection
          {
            id: 'selection',
            // The header can use the table's getToggleAllRowsSelectedProps method
            // to render a checkbox
            Header: function headerFunc({getToggleAllRowsSelectedProps}) {
              return (
                <div>
                  <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
                </div>
              )
            },
            // The cell can use the individual row's getToggleRowSelectedProps method
            // to the render a checkbox
            Cell: function cellFunc({row}) {
              return (
                <div>
                  <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
                </div>
              )
            },
            width: 40,
          },
          ...columns,
        ])
      }
    },
  )

  const itemData = {
    rows,
    prepareRow,
    onRowClick,
  }

  return (
    <TableAndFilterContainer totalWidth={totalColumnsWidth}>
      <SearchAndOtherButtons
        // props related to search
        preGlobalFilteredRows={preGlobalFilteredRows}
        globalFilter={state.globalFilter}
        setGlobalFilter={setGlobalFilter}
        onAddClick={onAddClick}
        searchPlaceHolderText={searchPlaceHolderText}
        onNoticeClick={onNoticeClick}
        noticeType={noticeType}
        selectedRows={selectedFlatRows}
        onDocumentDownloadClick={onDocumentDownloadClick}
        rows={rows}
        columns={columns}
      />
      <TableContainer reactTableProps={{...getTableProps()}}>
        <TableHeader
          reactTableHeaderGroups={headerGroups}
          tableHeight={tableHeight}
          rowHeight={rowHeight}
          data={data}
        />

        {/* Start to tbody
                    This divide-y is for adding separator of table header
                    and table body
                */}
        <div
          className="bg-white divide-y divide-gray-200"
          {...getTableBodyProps()}
        >
          <FixedSizeList
            height={tableHeight}
            itemCount={rows.length}
            itemData={itemData}
            itemSize={rowHeight}
            width={totalColumnsWidth}
          >
            {RenderRow}
          </FixedSizeList>
        </div>
        {/* End of tbody */}
      </TableContainer>
    </TableAndFilterContainer>
  )
}

export default Table

// {
//     /*Start of tr
//                        FIXME: The row is using flex-row and justify-evenly the same
//                        would be applied to table header tr.
//                        make sure to keep it in sync
//                      */
// }
// ;<div className="flex flex-row justify-evenly items-start">
//     {/*Start of td: first column */}
//     <div className="px-6 py-4 whitespace-no-wrap">
//         <div className="flex items-center">
//             <div className="flex-shrink-0 h-10 w-10">
//                 <img
//                     className="h-10 w-10 rounded-full"
//                     src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=facearea&amp;facepad=4&amp;w=256&amp;h=256&amp;q=60"
//                     alt=""
//                 />
//             </div>
//             <div className="ml-4">
//                 <div className="text-sm leading-5 font-medium text-gray-900">
//                     Jane Cooper
//                 </div>
//                 <div className="text-sm leading-5 text-gray-500">
//                     jane.cooper@example.com
//                 </div>
//             </div>
//         </div>
//     </div>
//     {/*End of td: first column */}

//     {/*Start of td: second column */}
//     <div className="px-6 py-4 whitespace-no-wrap">
//         <div className="text-sm leading-5 text-gray-900">
//             Regional Paradigm Technician
//         </div>
//         <div className="text-sm leading-5 text-gray-500">Optimization</div>
//     </div>
//     {/*End of td: second column */}

//     {/*Start of td: third column */}
//     <div className="px-6 py-4 whitespace-no-wrap">
//         <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
//             Active
//         </span>
//     </div>
//     {/*End of td: third column */}

//     {/*Start of td: fourth column */}
//     <div className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
//         Admin
//     </div>
//     {/*End of td: fourth column */}

//     {/*Start of td: fifth column */}
//     <div className="px-6 py-4 whitespace-no-wrap text-right text-sm leading-5 font-medium">
//         <a href="#" className="text-indigo-600 hover:text-indigo-900">
//             Edit
//         </a>
//     </div>
//     {/*End of td: fifth column */}
// </div>
// {
//     /*End of tr */
// }

// {
//     /* <!-- More rows... --> */
// }
