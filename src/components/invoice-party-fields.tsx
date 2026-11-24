"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type InvoicePartyOption = {
  id: string;
  type: string;
  name: string;
  tin: string | null;
  email: string | null;
  phone: string | null;
  address: string;
};

type AddPartyResult =
  | { ok: true; party: InvoicePartyOption }
  | { ok: false; error: string };

type PartyContextValue = {
  parties: InvoicePartyOption[];
  addParty: (formData: FormData) => Promise<AddPartyResult>;
  remember: (party: InvoicePartyOption) => void;
};

const PartyContext = createContext<PartyContextValue | null>(null);

function useParties() {
  const value = useContext(PartyContext);
  if (!value) throw new Error("Party fields must sit inside the invoice party provider.");
  return value;
}

function setField(id: string, value: string) {
  const el = document.getElementById(id);
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.value = value;
  }
}

export function InvoicePartyProvider({
  parties: initial,
  addParty,
  children,
}: {
  parties: InvoicePartyOption[];
  addParty: (formData: FormData) => Promise<AddPartyResult>;
  children: ReactNode;
}) {
  const [parties, setParties] = useState(initial);

  function remember(party: InvoicePartyOption) {
    setParties((current) =>
      [...current.filter((item) => item.id !== party.id), party].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    );
  }

  return (
    <PartyContext.Provider value={{ parties, addParty, remember }}>{children}</PartyContext.Provider>
  );
}

export function AddSellerBuyer() {
  const { addParty, remember } = useParties();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [role, setRole] = useState("BUYER");
  const [draft, setDraft] = useState({
    name: "",
    phone: "",
    email: "",
    tin: "",
    address: "",
  });

  async function saveParty() {
    const name = draft.name.trim();
    if (!name) {
      setNotice("Enter a name before saving.");
      return;
    }
    setPending(true);
    const formData = new FormData();
    formData.set("role", role);
    formData.set("name", name);
    formData.set("phone", draft.phone.trim());
    formData.set("email", draft.email.trim());
    formData.set("tin", draft.tin.trim());
    formData.set("address", draft.address.trim());
    const result = await addParty(formData);
    setPending(false);
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    remember(result.party);
    setDraft({ name: "", phone: "", email: "", tin: "", address: "" });
    setOpen(false);
    setNotice(`${result.party.name} is saved. Choose that name in the company or buyer field, or type a different one.`);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-secondary" onClick={() => setOpen((value) => !value)}>
          Add Seller/Buyer
        </button>
        {notice ? <p className="text-sm text-[color:var(--brand-accent)]">{notice}</p> : null}
      </div>
      {open ? (
        <div className="space-y-3 rounded-lg bg-white/70 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="newPartyRole">
                This party is a
              </label>
              <select
                id="newPartyRole"
                className="field"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="SELLER">Seller</option>
                <option value="BUYER">Buyer</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="newPartyName">
                Name
              </label>
              <input
                id="newPartyName"
                className="field"
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div>
              <label className="label" htmlFor="newPartyPhone">
                Phone
              </label>
              <input
                id="newPartyPhone"
                className="field"
                value={draft.phone}
                onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
              />
            </div>
            <div>
              <label className="label" htmlFor="newPartyEmail">
                Email
              </label>
              <input
                id="newPartyEmail"
                type="email"
                className="field"
                value={draft.email}
                onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
              />
            </div>
            <div>
              <label className="label" htmlFor="newPartyTin">
                TIN
              </label>
              <input
                id="newPartyTin"
                className="field"
                value={draft.tin}
                onChange={(event) => setDraft((current) => ({ ...current, tin: event.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="newPartyAddress">
                Address
              </label>
              <textarea
                id="newPartyAddress"
                rows={2}
                className="field"
                value={draft.address}
                onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))}
              />
            </div>
          </div>
          <button type="button" className="btn-primary" onClick={saveParty} disabled={pending}>
            {pending ? "Saving…" : "Save party"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function PartyNameField({
  kind,
  id,
  name,
  label,
  required,
  defaultValue,
  defaultPartyId,
}: {
  kind: "seller" | "buyer";
  id: string;
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
  defaultPartyId?: string;
}) {
  const { parties } = useParties();
  const listId = `${id}-parties`;

  function onValue(value: string) {
    const match = parties.find(
      (party) => party.name.trim().toLowerCase() === value.trim().toLowerCase(),
    );
    if (kind === "buyer") {
      const hidden = document.getElementById("partyId");
      if (hidden instanceof HTMLInputElement) hidden.value = match?.id ?? "";
    }
    if (!match) return;
    if (kind === "seller") {
      setField("sellerAddress", match.address);
      setField("sellerPhone", match.phone ?? "");
      setField("sellerEmail", match.email ?? "");
      setField("sellerTin", match.tin ?? "");
      return;
    }
    setField("buyerAddress", match.address);
    setField("buyerPhone", match.phone ?? "");
    setField("buyerEmail", match.email ?? "");
  }

  return (
    <div className={kind === "seller" ? "sm:col-span-2" : undefined}>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        className="field"
        list={listId}
        required={required}
        defaultValue={defaultValue}
        placeholder="Select a saved party or type a name"
        onInput={(event) => onValue(event.currentTarget.value)}
        onBlur={(event) => onValue(event.currentTarget.value)}
      />
      <datalist id={listId}>
        {parties.map((party) => (
          <option
            key={party.id}
            value={party.name}
            label={party.type === "SUPPLIER" ? "Seller" : "Buyer"}
          />
        ))}
      </datalist>
      {kind === "buyer" ? (
        <input type="hidden" id="partyId" name="partyId" defaultValue={defaultPartyId ?? ""} />
      ) : null}
      <p className="mt-1 text-xs text-black/50">
        Pick a saved party to fill the details, or type a name that is not on the list.
      </p>
    </div>
  );
}
