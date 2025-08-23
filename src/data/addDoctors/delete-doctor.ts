
import deleteTherapist from "@/actions/addDoctors/delete-doctor";
import { useMutation, useQueryClient } from "@tanstack/react-query";


export function useDeleteTherapist () {
    const queryClient  = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) =>  deleteTherapist(id),
        onSuccess: (data) => {
            queryClient.invalidateQueries({queryKey:["getAllEmployee"]})
          console.log('Data posted successfully:', data);
        },
        onError: (error) => {
          console.error('Error posting data:', error);
        },
    })
}