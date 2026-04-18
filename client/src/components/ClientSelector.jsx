import MultiSelect from './MultiSelect';

export default function ClientSelector({ clientes = [], selected = [], onChange }) {
  return (
    <MultiSelect
      items={clientes}
      selected={selected}
      onChange={onChange}
      allLabel="Todos los clientes"
      itemLabelSingular="cliente"
      itemLabelPlural="clientes"
      searchable
      width="w-80"
    />
  );
}
