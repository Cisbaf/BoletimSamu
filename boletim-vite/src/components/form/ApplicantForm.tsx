import {
  Field,
  HStack,
  NativeSelect,
  Button,
  Stack,
  Input,
  SimpleGrid,
  Grid,
} from "@chakra-ui/react";
import { useDocumentFormContext } from "../../context/DocumentFormContext";
import { APPLICANT_TYPES, RELATIONSHIP_DEGREES, APPLICANT_TYPE_LABELS, RELATIONSHIP_DEGREE_LABELS } from "../../domain/documentSchemaForm";
import { useWatch } from "react-hook-form";
import React from "react";


export default function ApplicantForm() {
    const { form } = useDocumentFormContext();
    const {formState: { errors }, register, setValue } = form;
    
    const applicantType = useWatch({
        control: form.control,
        name: "applicant.applicant_type",
    });

    React.useEffect(() => {
    if (applicantType === "PATIENT") {
        form.setValue("applicant.relationship_degree", undefined);
    }
    }, [applicantType]);

    return (
        <Stack >

        {/* SESSÃO 1*/}
        <SimpleGrid
            columns={{ base: 1, lg: 2 }}
            gap={6}
            w="100%">
         {/* APPLICANT TYPE */}
            <Field.Root invalid={!!errors.applicant?.applicant_type}>
                <Field.Label  fontWeight={"bold"}>Tipo de solicitante</Field.Label>
                <HStack gap={2}>
                    {APPLICANT_TYPES.map((type) => {
                    const isActive = applicantType === type;
                    return (
                    <Button
                        key={type}
                        flex={1}
                        aria-pressed={isActive}
                        role="radio"
                        variant={isActive ? "solid" : "outline"}
                        colorScheme={isActive ? "blue" : "gray"}
                        onClick={() =>
                        setValue("applicant.applicant_type", type, {
                            shouldValidate: true,
                            shouldDirty: true,
                        })}>
                        {APPLICANT_TYPE_LABELS[type]}
                    </Button>
                    );
                })}
                </HStack>
                <Field.ErrorText> {errors.applicant?.applicant_type?.message}</Field.ErrorText>
            </Field.Root>


        {/* RELATIONSHIP (CONDICIONAL) */}
        {applicantType === "REPRESENTATIVE" && (
          <Field.Root
            invalid={!!errors.applicant?.relationship_degree}
          >
            <Field.Root invalid={!!errors.applicant?.relationship_degree}>
            <Field.Label  fontWeight={"bold"}>Grau de parentesco</Field.Label>
            <NativeSelect.Root>
                <NativeSelect.Field
                placeholder="Selecione"
                {...register("applicant.relationship_degree")}
                >
                {RELATIONSHIP_DEGREES.map(r => (
                    <option key={r} value={r}>
                    {RELATIONSHIP_DEGREE_LABELS[r]}
                    </option>
                ))}
                </NativeSelect.Field>
            </NativeSelect.Root>
            <Field.ErrorText> {errors.applicant?.relationship_degree?.message}</Field.ErrorText>
            </Field.Root>
          </Field.Root>
        )}
        </SimpleGrid>

        {/* SESSÃO 2*/}
        <Grid
            w={"100%"}
              templateColumns={{
                base: "1fr",          // mobile
                md: "1fr 1fr",        // tablet
                lg: "3fr 3fr 2fr",    // desktop
            }}
            gap={6}>

            {/* FULL NAME */}
            <Field.Root invalid={!!errors.applicant?.full_name}>
                <Field.Label  fontWeight={"bold"}>Nome completo</Field.Label>
                <Input
                    variant="outline"
                    autoComplete="name"
                    {...register("applicant.full_name")} />
                <Field.ErrorText>
                    {errors.applicant?.full_name?.message}
                </Field.ErrorText>
            </Field.Root>

            {/* CPF */}
            <Field.Root invalid={!!errors.applicant?.cpf}>
                <Field.Label  fontWeight={"bold"}>CPF</Field.Label>
                <Input
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="000.000.000-00" {...register("applicant.cpf")} />
                <Field.ErrorText>
                    {errors.applicant?.cpf?.message}
                </Field.ErrorText>
            </Field.Root>

            {/* RG */}
            <Field.Root invalid={!!errors.applicant?.rg}>
                <Field.Label  fontWeight={"bold"}>RG</Field.Label>
                <Input variant="outline" type="numeric" {...register("applicant.rg")} />
                <Field.ErrorText>
                    {errors.applicant?.rg?.message}
                </Field.ErrorText>
            </Field.Root>

        </Grid>

        {/* SESSÃO 3*/}
        <Grid
            w={"100%"}
              templateColumns={{
                base: "1fr",          // mobile
                md: "1fr 1fr",        // tablet
                lg: "2fr 3fr 2fr",    // desktop
            }}
            gap={6}>
            {/* Email */}
            <Field.Root invalid={!!errors.applicant?.email}>
                <Field.Label  fontWeight={"bold"}>Email</Field.Label>
                <Input
                    autoComplete="email"
                    variant="outline"
                    {...register("applicant.email")} />
                <Field.ErrorText>
                    {errors.applicant?.email?.message}
                </Field.ErrorText>
            </Field.Root>

            {/* Endereço */}
            <Field.Root invalid={!!errors.applicant?.address}>
                <Field.Label  fontWeight={"bold"}>Endereço</Field.Label>
                <Input variant="outline" {...register("applicant.address")} />
                <Field.ErrorText>
                    {errors.applicant?.address?.message}
                </Field.ErrorText>
            </Field.Root>

            {/* Telefone */}
            <Field.Root invalid={!!errors.applicant?.phone}>
                <Field.Label  fontWeight={"bold"}>Telefone</Field.Label>
                <Input
                autoComplete="tel"
                variant="outline"
                type="number"
                {...register("applicant.phone")} />
                <Field.ErrorText> {errors.applicant?.phone?.message}</Field.ErrorText>
            </Field.Root>
            </Grid>
    </Stack>
    )
}