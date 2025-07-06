FROM hashicorp/terraform:1.5.0

# Install additional tools
RUN apk add --no-cache \
    curl \
    jq \
    bash

# Set working directory
WORKDIR /terraform

# Copy Terraform files
COPY . .

# Make provision script executable
RUN chmod +x provision.sh

# Use bash for our script since it uses bash-specific syntax
ENTRYPOINT ["/bin/bash"]
CMD ["./provision.sh"] 