import {
  Field,
  Stack,
  Input,
  Textarea,
  SimpleGrid,
  NativeSelect,
  RadioGroup,
  Box,
} from "@chakra-ui/react";
import { useDocumentFormContext } from "../../context/DocumentFormContext";
import {
  ATTENDANCE_LOCATIONS,
  CITIES,
  LOCATION_LABELS,
  PURPOSES,
} from "../../domain/documentSchemaForm";
import { Controller } from "react-hook-form";

export default function IncidentForm() {
  const { form } = useDocumentFormContext();
  const {
    formState: { errors },
    register,
    control,
    watch
  } = form;

  const location = watch("incident.attendance_location");
  const applicantType = watch("applicant.applicant_type");

  const isPurposeDisabled = (purpose: string) => {
    if (applicantType === "PATIENT" && purpose === "OBITO") {
      return true;
    }
    return false;
  };

  return (
    <Stack
      w="100%"
      mx="auto">
      {/* ================= SESSÃO 1 ================= */}
      <Box>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          
          {/* Nome */}
          <Field.Root mb={5} invalid={!!errors.incident?.patient_name}>
            <Field.Label fontWeight="medium">
              Nome Completo do Paciente
            </Field.Label>
            <Input
              variant="outline"
              {...register("incident.patient_name")}
            />
            <Field.ErrorText>
              {errors.incident?.patient_name?.message}
            </Field.ErrorText>
          </Field.Root>

          {/* Data */}
          <Field.Root mb={5} invalid={!!errors.incident?.date}>
            <Field.Label fontWeight="medium">
              Data da Ocorrência
            </Field.Label>
            <Input
              type="date"
              variant="outline"
              {...register("incident.date")}
            />
            <Field.ErrorText>
              {errors.incident?.date?.message}
            </Field.ErrorText>
          </Field.Root>

          {/* Hora */}
          <Field.Root mb={5} invalid={!!errors.incident?.time}>
            <Field.Label fontWeight="medium">
              Hora da Ocorrência
            </Field.Label>
            <Input
              type="time"
              variant="outline"
              {...register("incident.time")}
            />
            <Field.ErrorText>
              {errors.incident?.time?.message}
            </Field.ErrorText>
          </Field.Root>

        </SimpleGrid>
      </Box>

      {/* ================= SESSÃO 2 ================= */}
      <Box>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          
          {/* Município */}
          <Field.Root mb={5} invalid={!!errors.incident?.city}>
            <Field.Label fontWeight="medium">
              Município da Ocorrência
            </Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                placeholder="Selecione"
                {...register("incident.city")}
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
            <Field.ErrorText>
              {errors.incident?.city?.message}
            </Field.ErrorText>
          </Field.Root>

          {/* Bairro */}
          <Field.Root mb={5} invalid={!!errors.incident?.neighborhood}>
            <Field.Label fontWeight="medium">Bairro</Field.Label>
            <Input
              variant="outline"
              {...register("incident.neighborhood")}
            />
            <Field.ErrorText>
              {errors.incident?.neighborhood?.message}
            </Field.ErrorText>
          </Field.Root>

          {/* Endereço */}
          <Field.Root mb={5} invalid={!!errors.incident?.address}>
            <Field.Label fontWeight="medium">Endereço</Field.Label>
            <Input
              variant="outline"
              {...register("incident.address")}
            />
            <Field.ErrorText>
              {errors.incident?.address?.message}
            </Field.ErrorText>
          </Field.Root>

        </SimpleGrid>
      </Box>

      {/* ================= MOTIVO ================= */}
      <Field.Root mb={5} invalid={!!errors.incident?.reason}>
        <Field.Label fontWeight="medium">
          Motivo da solicitação da ambulância (máx. 50 caracteres)
        </Field.Label>
        <Input
          maxLength={50}
          variant="outline"
          {...register("incident.reason")}
        />
        <Field.ErrorText>
          {errors.incident?.reason?.message}
        </Field.ErrorText>
      </Field.Root>

      {/* ================= SESSÃO 3 ================= */}
      <Box bg="gray.50" borderRadius="lg">
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={8}>
          
          {/* Local do atendimento */}
          <Field.Root mb={5} invalid={!!errors.incident?.attendance_location}>
            <Field.Label fontWeight="medium">
              Local do atendimento
            </Field.Label>

            <Controller
              control={control}
              name="incident.attendance_location"
              render={({ field }) => (
                <RadioGroup.Root
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                >
                  <Stack
                    direction={{ base: "column", md: "row" }}
                    gap={4}
                    flexWrap="wrap"
                  >
                    {ATTENDANCE_LOCATIONS.map((location) => (
                      <RadioGroup.Item key={location} value={location}>
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText>
                          {LOCATION_LABELS[location]}
                        </RadioGroup.ItemText>
                      </RadioGroup.Item>
                    ))}
                  </Stack>
                </RadioGroup.Root>
              )}
            />

            <Field.ErrorText>
              {errors.incident?.attendance_location?.message}
            </Field.ErrorText>
          </Field.Root>

          {location == "OTH" && 
            <Field.Root mb={5} invalid={!!errors.incident?.other_location_description}>
              <Field.Label fontWeight="medium">
                Outro Local
              </Field.Label>
              <Input
                variant="subtle"
                {...register("incident.other_location_description")}
              />
              <Field.ErrorText>
                {errors.incident?.other_location_description?.message}
              </Field.ErrorText>
            </Field.Root>
          }

          {/* Finalidade */}
          <Field.Root mb={5} invalid={!!errors.purpose}>
            <Field.Label fontWeight="medium">
              Finalidade da Documentação
            </Field.Label>

            <Controller
              control={control}
              name="purpose"
              render={({ field }) => (
                <RadioGroup.Root
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                >
                  <Stack
                    direction={{ base: "column", md: "row" }}
                    gap={4}
                    flexWrap="wrap"
                  >
                    {PURPOSES.map((purpose) => (
                      <RadioGroup.Item
                          key={purpose}
                          value={purpose}
                          disabled={isPurposeDisabled(purpose)}>
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText>
                          {purpose}
                        </RadioGroup.ItemText>
                      </RadioGroup.Item>
                    ))}
                  </Stack>
                </RadioGroup.Root>
              )}
            />

            <Field.ErrorText>
              {errors.purpose?.message}
            </Field.ErrorText>
          </Field.Root>

        </SimpleGrid>
      </Box>

      {/* ================= Nº OCORRÊNCIA ================= */}
      <Field.Root mb={5} invalid={!!errors.incident?.occurrence_number}>
        <Field.Label fontWeight="medium">
          Número da Ocorrência (Opcional)
        </Field.Label>
        <Input
          variant="outline"
          {...register("incident.occurrence_number")}
        />
        <Field.ErrorText>
          {errors.incident?.occurrence_number?.message}
        </Field.ErrorText>
      </Field.Root>

      {/* ================= OBSERVAÇÕES ================= */}
      <Field.Root mb={5} invalid={!!errors.incident?.notes}>
        <Field.Label fontWeight="medium">
          Observações (máx. 150 caracteres)
        </Field.Label>
        <Textarea
          maxLength={150}
          size="md"
          variant="outline"
          h={120}
          {...register("incident.notes")}
        />
        <Field.ErrorText>
          {errors.incident?.notes?.message}
        </Field.ErrorText>
      </Field.Root>

    </Stack>
  );
}
