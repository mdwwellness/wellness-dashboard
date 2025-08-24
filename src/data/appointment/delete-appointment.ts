
import deleteAppointment from "@/actions/appointments/delete-appointments";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


export function useDeleteAppointment() {
    const queryClient  = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) =>  deleteAppointment(id),
        onSuccess: (data) => {
            if(data.success){
                toast.success("Appointment cancelled successfully");
            }else{
                toast.error("something went wrong",{description:data.message});
            }
            queryClient.invalidateQueries({queryKey:["getAllAppointments"]})
        },
        onError: (error) => {
          console.error('Error posting data:', error);
        },
    })
}