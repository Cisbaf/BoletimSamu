import { ButtonGroup, IconButton, Pagination } from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { useFilters } from "../../context/FilterContext";

interface PaginationDocsProps {
  count?: number;
  pageSize?: number;
}


export function PaginationForDocs(props: PaginationDocsProps) {
  const { filters, setFilter } = useFilters();

  const count = props.count || 0;
  const currentPage = filters.page || 1;
  const pageSize = props.pageSize || 5; // 👈 igual ao backend

  return (
    <Pagination.Root
      count={count}
      pageSize={pageSize}
      page={currentPage} // 🔥 controlado
      onPageChange={(e) => setFilter("page", e.page)} // 🔥 integra com filtro
    >
      <ButtonGroup variant="ghost" size="sm">
        
        <Pagination.PrevTrigger asChild>
          <IconButton disabled={currentPage === 1}>
            <LuChevronLeft />
          </IconButton>
        </Pagination.PrevTrigger>

        <Pagination.Items
          render={(page) => (
            <IconButton
              variant={page.value === currentPage ? "outline" : "ghost"}
            >
              {page.value}
            </IconButton>
          )}
        />

        <Pagination.NextTrigger asChild>
          <IconButton
            disabled={currentPage * pageSize >= count}
          >
            <LuChevronRight />
          </IconButton>
        </Pagination.NextTrigger>

      </ButtonGroup>
    </Pagination.Root>
  );
}