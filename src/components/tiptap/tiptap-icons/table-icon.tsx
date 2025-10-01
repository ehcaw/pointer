import * as React from "react"

export const TableIcon = React.memo(
  ({ className, ...props }: React.SVGProps<SVGSVGElement>) => {
    return (
      <svg
        width="24"
        height="24"
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3 6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V6ZM5 6H19V8H5V6ZM5 10H8V14H5V10ZM10 10H14V14H10V10ZM16 10H19V14H16V10ZM5 16H8V18H5V16ZM10 16H14V18H10V16ZM16 16H19V18H16V16Z"
          fill="currentColor"
        />
      </svg>
    )
  }
)

TableIcon.displayName = "TableIcon"
