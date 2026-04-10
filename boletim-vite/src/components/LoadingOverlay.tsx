// "use client"

// import { Flex, Spinner, Text } from "@chakra-ui/react"

// interface LoadingOverlayProps {
//   loading: boolean
//   text?: string
// }

// export default function LoadingOverlay({ loading, text }: LoadingOverlayProps) {
//   if (!loading) return null

//   return (
//     <Flex
//       position="fixed"
//       top="0"
//       left="0"
//       width="100vw"
//       height="100vh"
//       bg="blackAlpha.600"
//       zIndex="9999"
//       align="center"
//       justify="center"
//       direction="column"
//       gap={4}
//     >
//       <Spinner
//         size="xl"
//         thickness="4px"
//         color="blue.400"
//         animationDuration="0.8s"
//       />

//       {text && (
//         <Text color="white" fontSize="lg">
//           {text}
//         </Text>
//       )}
//     </Flex>
//   )
// }