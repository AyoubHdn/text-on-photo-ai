// src/components/SyncContactsButton.tsx
import { trpc } from "~/utils/trpc";

const SyncContactsButton = () => {
  const { mutate, isLoading } = trpc.mautic.syncContacts.useMutation({
    onSuccess: (data) => {
      console.log("Sync complete:", data);
      alert(`Sync complete! Total contacts: ${data.total}`);
    },
    onError: (error) => {
      console.error("Error syncing contacts:", error);
      alert("Error syncing contacts.");
    },
  });

  return (
    <button onClick={() => mutate()} disabled={isLoading}>
      Sync Contacts to Mautic
    </button>
  );
};

export default SyncContactsButton;
