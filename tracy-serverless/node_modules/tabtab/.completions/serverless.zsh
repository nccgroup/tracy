###-begin-serverless-completion-###
if type compdef &>/dev/null; then
  _serverless_completion () {
    local reply
    local si=$IFS

    IFS=$'\n' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" serverless completion -- "${words[@]}"))
    IFS=$si

    _describe 'values' reply
  }
  compdef _serverless_completion serverless
fi
###-end-serverless-completion-###
