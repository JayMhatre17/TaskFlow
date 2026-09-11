"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SelectRHF from "@/components/forms/SelectRHF";

import { teamMemberSchema, type TeamMemberFormValues } from "./team.schema";

const AddMemberForm = () => {
  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberSchema),

    defaultValues: {
      name: "",
      email: "",
      role: "Developer",
      status: "Active",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const onSubmit = (data: TeamMemberFormValues) => {
    console.log("Validated member:", data);
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name */}
        <div>
          <label className="mb-2 block text-sm font-medium">Name</label>

          <Input placeholder="Enter member name" {...register("name")} />

          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="mb-2 block text-sm font-medium">Email</label>

          <Input
            type="email"
            placeholder="member@example.com"
            {...register("email")}
          />

          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Role + Status */}
        <div className="grid gap-6 sm:grid-cols-2">
          <SelectRHF
            name="role"
            label="Role"
            placeholder="Select role"
            options={[
              {
                label: "Admin",
                value: "Admin",
              },
              {
                label: "Manager",
                value: "Manager",
              },
              {
                label: "Developer",
                value: "Developer",
              },
              {
                label: "Designer",
                value: "Designer",
              },
            ]}
          />

          <SelectRHF
            name="status"
            label="Status"
            placeholder="Select status"
            options={[
              {
                label: "Active",
                value: "Active",
              },
              {
                label: "Inactive",
                value: "Inactive",
              },
            ]}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline">
            Cancel
          </Button>

          <Button type="submit">Add Member</Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default AddMemberForm;
