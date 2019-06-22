###-begin-slss-completion-###
if type compdef &>/dev/null; then
  _slss_completion () {
    local reply
    local si=$IFS

    IFS=$'\n' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" slss completion -- "${words[@]}"))
    IFS=$si

    _describe 'values' reply
  }
  compdef _slss_completion slss
fi
###-end-slss-completion-###
