from pyocd.core.helpers import ConnectHelper
import json

if __name__ == '__main__':
    probes = [{
        'unique_id': p.unique_id,
        'description': p.description,
        'vendor_name': p.vendor_name,
        'product_name': p.product_name,
    } for p in ConnectHelper.get_all_connected_probes(blocking=False, print_wait_message=False)]
    print(json.dumps(probes))
