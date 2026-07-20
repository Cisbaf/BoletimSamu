import React from "react";
import {
  Box,
  Flex,
  Image,
  IconButton,
  Dialog,
  Portal,
  Text,
} from "@chakra-ui/react";
import type { DocumentFile } from "../../domain/documentDetail";
import { FaChevronLeft, FaChevronRight, FaDownload } from "react-icons/fa";
import { DOCUMENT_LABELS } from "../../domain/documentSchemaForm";
import { getFileType } from "../../utils/getFileType";
import { getBlob } from "../../helpers/getBlob";
import { downloadFile } from "../../helpers/downloadFile";
import { useToast } from "../../hooks/useToast";
import { FaEye } from "react-icons/fa";

function getAttachmentFileName(file: DocumentFile) {
  const label = DOCUMENT_LABELS[file.documentType] ?? "arquivo";
  const extMatch = file.fileUrl.match(/\.[a-zA-Z0-9]+(?:\?.*)?$/);
  const ext = extMatch ? extMatch[0].split("?")[0] : "";
  return `${label}${ext}`;
}

// 🔹 ITEM (anexo individual)
interface AttachmentItemProps {
  file: DocumentFile;
  isActive?: boolean;
  onClick?: () => void;
}

interface RenderFileProps {
  file: DocumentFile;
  imageFit: "cover" | "contain",
  pdfZoom: number;
}

export function RenderFile({file, imageFit, pdfZoom}: RenderFileProps) {
  const fileType = getFileType(file.fileUrl);
  const [pdfUrl, setPdfUrl] = React.useState<string>("");

  React.useEffect(()=>{
    if(fileType != "pdf") return;
      getBlob(`${file.fileUrl}`)
      .then(url=> setPdfUrl(url))
      .catch(()=> setPdfUrl(file.fileUrl));
  }, [file.fileUrl, fileType])

  return (
    <>
    {fileType === "image" && (
          <Image
            src={file.fileUrl}
            alt={file.documentType}
            objectFit={imageFit}
            w="100%"
            h="100%"
          />
        )}

        {fileType === "pdf" && pdfUrl && (
          <Box position="relative" w="100%" h="100%">
              <object
                data={`${pdfUrl}#page=1&zoom=${pdfZoom}`}
                type="application/pdf"
                width="100%"
                height="100%"
              />

              {/* overlay pra dar cara de preview */}
              <Flex
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                bg="rgba(0,0,0,0.5)"
                color="white"
                fontSize="xs"
                justify="center"
                py={1}
              >
                PDF
              </Flex>
              
          </Box>
        )}

        {fileType === "unknown" && (
          <Flex align="center" justify="center" h="100%">
            <Text fontSize="xs">Arquivo</Text>
          </Flex>
        )}
      </>
  )
}



export function AttachmentItem({ file, isActive, onClick }: AttachmentItemProps) {

  return (
    <Box
      cursor="pointer"
      transition="all 0.3s"
      transform={isActive ? "scale(1)" : "scale(0.85)"}
      opacity={isActive ? 1 : 0.5}
      onClick={onClick}
      display="flex"
      flexDirection={"column"}
      justifyContent="center"
      alignItems="center"
    >
     <Box
        borderRadius="xl"
        overflow="hidden"
        w={isActive ? "400px" : "90px"}
        h={isActive ? "300px" : "90px"}
        bg="gray.100"
      >
        <RenderFile file={file} imageFit="cover" pdfZoom={50}/>
      </Box>
      {isActive? (
          <Flex
          align="center"
          gap={2}
          cursor="pointer"
          color="blue.500"
          _hover={{ textDecoration: "underline", color: "blue.600" }}
        >
          <FaEye size={14} />
          <Text fontSize={isActive ? "lg" : "sm"}>
            {DOCUMENT_LABELS[file.documentType]}
          </Text>
        </Flex>
      ):   <Text textStyle={isActive ? "lg" : "xs"}>{DOCUMENT_LABELS[file.documentType]}</Text>}
    </Box>
  );
}

// 🔹 CARROSSEL
interface AttachmentCarouselProps {
  files: DocumentFile[];
}

export default function AttachmentCarousel({ files }: AttachmentCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const toast = useToast();

  if (!files || files.length === 0) return null;

  const handleDownload = async () => {
    const file = files[currentIndex];
    setDownloading(true);
    try {
      await downloadFile(file.fileUrl, getAttachmentFileName(file));
    } catch {
      toast.error({ description: "Não foi possível baixar o anexo." });
    } finally {
      setDownloading(false);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? files.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === files.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <Flex direction="column" align="center" gap={4} w="full">
        {/* 🔹 IMAGEM PRINCIPAL */}
        <Flex align="center" gap={4}>
          <IconButton aria-label="prev" onClick={handlePrev}>
            <FaChevronLeft />
          </IconButton>

          {/* 🔥 clique abre dialog */}
          <AttachmentItem
            file={files[currentIndex]}
            isActive
            onClick={() => setOpen(true)}
          />

          <IconButton aria-label="next" onClick={handleNext}>
            <FaChevronRight />
          </IconButton>
        </Flex>

        {/* 🔹 THUMBNAILS */}
        <Flex gap={3} overflowX="auto" maxW="100%" justify="center">
          {files.map((file, index) => {
            if (index === currentIndex) return null;

            return (
              <AttachmentItem
                key={file.id}
                file={file}
                isActive={false}
                onClick={() => setCurrentIndex(index)}
              />
            );
          })}
        </Flex>
      </Flex>

      {/* 🔹 DIALOG (Ark UI / Chakra v3) */}
      <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop bg="" />
          <Dialog.Positioner>
            <Dialog.Content bg="black" maxW="90vw" maxH="90vh">
              <IconButton
                aria-label="Baixar anexo"
                title="Baixar anexo"
                position="absolute"
                top={4}
                right={16}
                zIndex={10}
                loading={downloading}
                onClick={handleDownload}
              >
                <FaDownload />
              </IconButton>

              <Dialog.CloseTrigger asChild>
                <IconButton
                  aria-label="close"
                  position="absolute"
                  top={4}
                  right={4}
                  zIndex={10}
                >
                  ✕
                </IconButton>
              </Dialog.CloseTrigger>
                <Flex align="center" justify="center" h="85vh" w="100%">
                  <RenderFile file={files[currentIndex]} imageFit="contain" pdfZoom={100}/>
                </Flex>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
