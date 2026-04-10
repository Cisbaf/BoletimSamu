import { Tabs } from "@chakra-ui/react"
import { FilterProvider } from "../../context/FilterContext"
import PendingDocuments from "./PendingDocuments"
import { BsClockHistory } from "react-icons/bs";
import { LuFileSearch } from "react-icons/lu";
import SearchDocuments from "./SearchDocuments"


export default function TabsStatus() {

    return (
        <Tabs.Root defaultValue="aguardando" lazyMount>
            <Tabs.List>
                <Tabs.Trigger value="aguardando">
                    <BsClockHistory/>
                    Aguardando
                </Tabs.Trigger>
                <Tabs.Trigger value="search">
                    <LuFileSearch/>
                    Buscar
                </Tabs.Trigger>
                
            </Tabs.List>
            <Tabs.Content value="aguardando">
                <FilterProvider>
                    <PendingDocuments/>
                </FilterProvider>
            </Tabs.Content>
            <Tabs.Content value="search">
                 <FilterProvider>
                    <SearchDocuments/>
                </FilterProvider>
            </Tabs.Content>
        </Tabs.Root>
    )
}