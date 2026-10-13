# Equal cost gender
# Prior vs. posterior ratings of perceived hierarchy across work conditions
library(tidyverse)

df <- read_csv(here::here("equal_cost_gender", "data", "mit_exp2a_raw_data.csv"))

#get ratings
ratings <- df %>%
  filter(response_type == "response") %>%
  mutate(rating = as.numeric(str_extract(response, "\\d+(?=\\})"))) %>%
  select(anon_id, scenario_label, category, work_condition,
         gender_condition, stage, rating)

nrow(ratings)
summary(ratings$rating)

#attention checks (Participant 10 passed the attention check, but not the memory check, I decided to keep them for the analysis)
attention <- df %>%
  filter(response_type == "exit_survey") %>%
  select(anon_id, attention_fails, memory_correct_count, attention_passed)

attention
table(attention$attention_passed)

ratings_clean <- ratings
n_distinct(ratings_clean$anon_id)

#Calculate belief update (posterior - prior)
belief_update <- ratings_clean %>%
  pivot_wider(names_from = stage, values_from = rating) %>%
  mutate(update = posterior - prior)

head(belief_update)
nrow(belief_update)
table(belief_update$scenario_label, belief_update$work_condition)

#Participant means and condition means
#average each participant's ratings within each condition, then average those participant means within each condition.
participant_means <- belief_update %>%
  group_by(anon_id, work_condition) %>%
  summarise(prior     = mean(prior),
            posterior = mean(posterior),
            update    = mean(update),
            .groups   = "drop")

condition_means <- participant_means %>%
  group_by(work_condition) %>%
  summarise(mean_prior     = mean(prior),
            mean_posterior = mean(posterior),
            mean_update    = mean(update),
            se_update      = sd(update) / sqrt(n()),
            n              = n())

condition_means

#Plot labels
condition_labels <- c(both_alternate    = "Alternating",
                      division_of_labor = "Division of Labor",
                      one_does_all      = "One Does All")

direction_colors <- c("Increased" = "#e66101",
                      "Decreased" = "#008837",
                      "No change" = "#2166ac")

# Plot 1: Participant means plot. Each line represents one participant's average rating within one condition (prior -> posterior). Diamond = condition mean, error bars = 95% CI across participants.
plot_data <- participant_means %>%
  mutate(direction = case_when(posterior > prior ~ "Increased",
                               posterior < prior ~ "Decreased",
                               TRUE              ~ "No change")) %>%
  pivot_longer(c(prior, posterior), names_to = "stage", values_to = "rating") %>%
  mutate(stage = factor(stage, levels = c("prior", "posterior"),
                        labels = c("Prior", "Posterior")))

plot_summary <- plot_data %>%
  group_by(work_condition, stage) %>%
  summarise(mean = mean(rating),
            se   = sd(rating) / sqrt(n()),
            .groups = "drop")

participant_plot <- ggplot(plot_data, aes(x = stage, y = rating)) +
  geom_violin(fill = "grey90", color = "grey60") +
  geom_line(aes(group = anon_id, color = direction), alpha = 0.5) +
  geom_errorbar(data = plot_summary,
                aes(y = mean, ymin = mean - 1.96 * se, ymax = mean + 1.96 * se),
                width = 0.06, linewidth = 0.8) +
  geom_point(data = plot_summary, aes(y = mean), shape = 18, size = 3) +
  facet_wrap(~ work_condition, labeller = labeller(work_condition = condition_labels)) +
  scale_color_manual(values = direction_colors) +
  scale_y_continuous(breaks = 0:6) +
  labs(x = NULL,
       y = "Perceived hierarchy\n(0 = Completely equal, 6 = Extremely hierarchical)",
       title = "Belief update: mean per participant",
       subtitle = "Diamond = mean, error bars = 95% CI",
       color = "Direction of update") +
  theme_minimal(base_size = 13) +
  theme(plot.title = element_text(face = "bold"),
        strip.text = element_text(face = "bold"),
        legend.position = "bottom")

participant_plot

#Plot 2:individual ratings plot. Each line = one single rating (one participant x one scenario), prior -> posterior, jittered so overlapping lines are visible (about 120 lines per condition). Diamond = condition mean, error bars = 95% CI across ratings.

set.seed(1) # make the jitter reproducible

trial_lines <- belief_update %>%
  mutate(jit = runif(n(), -0.1, 0.1),
         direction = case_when(update > 0 ~ "Increased",
                               update < 0 ~ "Decreased",
                               TRUE       ~ "No change")) %>%
  pivot_longer(c(prior, posterior), names_to = "stage", values_to = "rating") %>%
  mutate(stage_num  = if_else(stage == "prior", 0, 1),
         rating_jit = rating + jit)

trial_summary <- trial_lines %>%
  group_by(work_condition, stage_num) %>%
  summarise(mean = mean(rating),
            se   = sd(rating) / sqrt(n()),
            .groups = "drop")

individual_ratings_plot <- ggplot(trial_lines, aes(x = stage_num)) +
  geom_violin(aes(y = rating, group = stage_num),
              fill = "grey90", alpha = 0.6, color = "grey60", linewidth = 0.4) +
  geom_line(aes(y = rating_jit, group = interaction(anon_id, scenario_label),
                color = direction),
            alpha = 0.25, linewidth = 0.6) +
  geom_errorbar(data = trial_summary,
                aes(ymin = mean - 1.96 * se, ymax = mean + 1.96 * se),
                width = 0.06, linewidth = 0.8) +
  geom_point(data = trial_summary, aes(y = mean), shape = 18, size = 3) +
  facet_wrap(~ work_condition, labeller = labeller(work_condition = condition_labels)) +
  scale_color_manual(values = direction_colors) +
  scale_x_continuous(breaks = c(0, 1), labels = c("Prior", "Posterior"),
                     limits = c(-0.6, 1.6)) +
  scale_y_continuous(breaks = 0:6) +
  labs(x = NULL,
       y = "Perceived hierarchy\n(0 = Completely equal, 6 = Extremely hierarchical)",
       color = "Direction of update") +
  theme_minimal(base_size = 13) +
  theme(panel.grid.minor = element_blank(),
        strip.text = element_text(face = "bold"),
        legend.position = "bottom") +
  guides(color = guide_legend(override.aes = list(alpha = 1, linewidth = 1.5)))

individual_ratings_plot


#Save both plots into equal_cost_gender/figures

fig_dir <- here::here("equal_cost_gender", "figures")
dir.create(fig_dir, showWarnings = FALSE)

plots <- list(
  participant_means_plot  = participant_plot,  # Plot 1
  individual_ratings_plot = individual_ratings_plot  # Plot 2
)

for (name in names(plots)) {
  ggsave(file.path(fig_dir, paste0(name, ".png")),
         plots[[name]], width = 9, height = 6, dpi = 300, bg = "white")
}

list.files(fig_dir)