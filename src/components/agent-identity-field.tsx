import { agentIdentities } from "@/lib/agent-identities";
import { SelectField } from "./ui/select-field";

export function AgentIdentityField({ value }: { value?: string | null }) {
  return (
    <SelectField
      label="Agent type"
      name="agentIdentity"
      defaultValue={value || ""}
      options={[
        { value: "", label: "Other / not sure" },
        ...agentIdentities.map(({ id, label, logo }) => ({
          value: id,
          label,
          image: `/brands/${logo}`,
        })),
      ]}
    />
  );
}
