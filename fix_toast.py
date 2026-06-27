import re

path = "/Users/deniz/Documents/navikont-admin-2/src/app/(app)/apps/[appId]/faqs/page.tsx"
with open(path, "r") as f:
    content = f.read()

content = content.replace("import { toast } from 'react-toastify';", "import Swal from 'sweetalert2';")

# Replace toast.success(...) with Swal.fire({title: ..., icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000})
content = content.replace("toast.success(", "Swal.fire({icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, title: ")
content = content.replace("toast.error(", "Swal.fire({icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, title: ")

# Fix the trailing parenthesis. 
# toast.success('SSS başarıyla eklendi.'); -> Swal.fire({..., title: 'SSS başarıyla eklendi.'});
content = content.replace("});", "})});")  # Very hacky, let's just use re.sub

