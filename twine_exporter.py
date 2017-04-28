"""
    Simple script to export a jg_shell json dump as a Twine formatted html file
"""
# Setup root_logger:
import logging as root_logger
LOGLEVEL = root_logger.DEBUG
LOG_FILE_NAME = "log.twine_exporter"
root_logger.basicConfig(filename=LOG_FILE_NAME, level=LOGLEVEL, filemode='w')

console = root_logger.StreamHandler()
console.setLevel(root_logger.INFO)
root_logger.getLogger('').addHandler(console)
logging = root_logger.getLogger(__name__)
##############################
# IMPORTS
####################
import sys
from os.path import join, isfile, exists, isdir, splitext
from os import listdir
import json
from random import randrange

def write_story():
    return "<tw-story></tw-story>"

def write_storydata(data, name="default_story", root=1):
    name = 'name="{}"'.format(name)
    startnode = 'startnode="{}"'.format(root)
    
    output = '<tw-storydata {} {} creator="Twine"'.format(name, startnode)
    output += """creator-version="2.0.11" format="Harlowe" options="" hidden><style role="stylesheet" id="twine-user-stylesheet" type="text/twine-css"></style><script role="script" id="twine-user-script" type="text/twine-javascript">
</script>"""
    #now write passage data
    for node in data["nodes"]:
        output += write_passagedata(node)
    
    output += "</tw-storydata>"
    return output

    
def write_passagedata(data):
    values_dict = dict(data['values'])
    pid = 'pid="{}"'.format(data['id'])
    name = 'name="{}"'.format(values_dict['name'])
    tags = 'tags="{}"'.format(" ".join(data['tags']))
    position = 'position="{}, {}"'.format(randrange(0, 100), randrange(0,100))
    
    output = """<tw-passagedata {} {} {} {}>""".format(pid, name, tags, position)
    
    output += values_dict['output']

    output += "</tw-passagedata>"
    return output

def write_to_twine_format(data):
    #data :: { "nodes": [], "root" : id }

    #Start the string
    output = "<!DOCTYPE html>\n<html>\n<head></head>\n"
    output += "<body>"
    #Add the actual data
    output += write_story()
    output += write_storydata(data, root=data['root'])
    
    #close the string
    output += "</body></html>"    
    return output
    


########################################
if __name__ == "__main__":
    args = sys.argv
    logging.info("Starting Export of {}".format(args[0]))
    if not isfile(args[1]):
        raise Exception('{} is not a file'.format(args[0]))
    name, ftype  = splitext(args[1])
    json_data = {}
    #read the json:
    logging.info("Reading Data")
    with open(args[1],'r') as f:
        json_data = json.load(f)

    outfile = "{}.html".format(name)
    logging.info("Formatting")
    data = write_to_twine_format(json_data)
    logging.info("Writing")
    with open(outfile, 'w') as f:
        f.write(data)
